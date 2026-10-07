import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIncentive, countingJobs, type CampaignRecord, type CompletedJob } from './incentives.calc';
import type { IncentivesRepository } from './incentives.repository';
import { incentivesService } from './incentives.service';
import { idParamSchema, listQuerySchema } from './incentives.validation';

const DAY = 86_400_000;
const NOW = new Date('2026-10-15T06:00:00Z');
const at = (days: number) => new Date(NOW.getTime() + days * DAY);

const campaign = (over: Partial<CampaignRecord> = {}): CampaignRecord => ({
  id: 'c1',
  title: 'Festive 40',
  description: 'Complete 40 jobs',
  targetJobs: 40,
  rewardAmount: 2000,
  startsAt: at(-10),
  endsAt: at(20),
  minRating: null,
  categoryIds: [],
  ...over,
});

/** n completed jobs, one per hour, starting at `start`. */
const jobsFrom = (start: Date, n: number, categoryId: string | null = null): CompletedJob[] =>
  Array.from({ length: n }, (_, i) => ({ completedAt: new Date(start.getTime() + i * 3_600_000), categoryId }));

const partner = { ratingAvg: 4.6, ratingCount: 30 };

test('progress counts only jobs completed inside the window (end is exclusive)', () => {
  const c = campaign({ startsAt: at(-10), endsAt: at(5) });
  const jobs: CompletedJob[] = [
    { completedAt: new Date(c.startsAt.getTime() - 1), categoryId: null }, // just before: no
    { completedAt: c.startsAt, categoryId: null }, // exactly at start: yes
    { completedAt: at(0), categoryId: null }, // inside: yes
    { completedAt: c.endsAt, categoryId: null }, // exactly at end: no
    { completedAt: at(6), categoryId: null }, // after: no
  ];
  assert.equal(countingJobs(c, jobs).length, 2);
});

test('active campaign shows 32 of 40, remaining, percent and days left', () => {
  const i = buildIncentive(NOW, campaign(), jobsFrom(at(-9), 32), partner);
  assert.equal(i.status, 'active');
  assert.deepEqual([i.completedJobs, i.targetJobs, i.remainingJobs, i.percent], [32, 40, 8, 80]);
  assert.equal(i.daysLeft, 20);
  assert.equal(i.startsInDays, null);
  assert.equal(i.achievedAt, null);
});

test('upcoming campaign has zero progress even if old jobs exist, and counts days to start', () => {
  const c = campaign({ startsAt: at(3), endsAt: at(33) });
  const i = buildIncentive(NOW, c, jobsFrom(at(-9), 10), partner);
  assert.equal(i.status, 'upcoming');
  assert.equal(i.completedJobs, 0);
  assert.equal(i.startsInDays, 3);
  assert.equal(i.daysLeft, null);
});

test('reaching the target completes the campaign and records when', () => {
  const jobs = jobsFrom(at(-9), 43);
  const i = buildIncentive(NOW, campaign(), jobs, partner);
  assert.equal(i.status, 'completed');
  assert.equal(i.remainingJobs, 0);
  assert.equal(i.percent, 100);
  assert.equal(i.completedJobs, 43);
  assert.equal(i.achievedAt, jobs[39].completedAt.toISOString()); // the 40th job
  assert.equal(i.daysLeft, null);
});

test('expired campaign: window over and target missed', () => {
  const c = campaign({ startsAt: at(-40), endsAt: at(-10) });
  const i = buildIncentive(NOW, c, jobsFrom(at(-39), 32), partner);
  assert.equal(i.status, 'expired');
  assert.deepEqual([i.completedJobs, i.percent, i.remainingJobs], [32, 80, 8]);
  assert.equal(i.daysLeft, null);
  assert.equal(i.achievedAt, null);
});

test('a campaign whose target was reached before it ended stays completed after it ends', () => {
  const c = campaign({ startsAt: at(-40), endsAt: at(-10) });
  assert.equal(buildIncentive(NOW, c, jobsFrom(at(-39), 40), partner).status, 'completed');
});

test('category rule: only jobs in the listed categories count', () => {
  const c = campaign({ categoryIds: ['cat-a'] });
  const jobs = [...jobsFrom(at(-9), 5, 'cat-a'), ...jobsFrom(at(-8), 7, 'cat-b'), ...jobsFrom(at(-7), 3, null)];
  assert.equal(buildIncentive(NOW, c, jobs, partner).completedJobs, 5);
});

test('rating rule: below the minimum is not eligible, never completes, and says why', () => {
  const c = campaign({ minRating: 4.5, targetJobs: 5 });
  const low = buildIncentive(NOW, c, jobsFrom(at(-9), 8), { ratingAvg: 4.2, ratingCount: 12 });
  assert.equal(low.eligible, false);
  assert.match(low.ineligibleReason ?? '', /4\.5.*4\.2/);
  assert.equal(low.status, 'active'); // 8 jobs but not eligible, so no reward yet
  const ok = buildIncentive(NOW, c, jobsFrom(at(-9), 8), { ratingAvg: 4.5, ratingCount: 12 });
  assert.equal(ok.eligible, true);
  assert.equal(ok.status, 'completed');
});

test('rating rule: a partner with no ratings yet gets a clear reason', () => {
  const i = buildIncentive(NOW, campaign({ minRating: 4 }), [], { ratingAvg: 0, ratingCount: 0 });
  assert.equal(i.eligible, false);
  assert.match(i.ineligibleReason ?? '', /no ratings yet/);
});

test('ineligible partner who hit the target is expired once the window closes', () => {
  const c = campaign({ startsAt: at(-40), endsAt: at(-10), minRating: 4.5, targetJobs: 5 });
  assert.equal(buildIncentive(NOW, c, jobsFrom(at(-39), 8), { ratingAvg: 3, ratingCount: 4 }).status, 'expired');
});

/** In-memory repo. `jobs` can grow between calls to simulate a job completing. */
function fakeRepo(campaigns: CampaignRecord[], jobs: CompletedJob[], hasPartner = true) {
  const repo = {
    findPartnerByUserId: async (userId: string) => (hasPartner && userId === 'user-1' ? { id: 'p1', ...partner } : null),
    listCampaigns: async () => campaigns,
    findCampaign: async (id: string) => campaigns.find((c) => c.id === id) ?? null,
    listCompletedJobs: async (_p: string, from: Date, to: Date) =>
      jobs.filter((j) => j.completedAt >= from && j.completedAt < to),
  };
  return { jobs, repo: repo as unknown as IncentivesRepository };
}

test('list groups campaigns, orders them, and totals the reward earned', async () => {
  const campaigns = [
    campaign({ id: 'a-late', title: 'Ends later', startsAt: at(-5), endsAt: at(25), targetJobs: 100 }),
    campaign({ id: 'a-soon', title: 'Ends soon', startsAt: at(-5), endsAt: at(4), targetJobs: 100 }),
    campaign({ id: 'up2', startsAt: at(10), endsAt: at(40) }),
    campaign({ id: 'up1', startsAt: at(2), endsAt: at(30) }),
    campaign({ id: 'done', startsAt: at(-30), endsAt: at(-5), targetJobs: 3, rewardAmount: 500 }),
    campaign({ id: 'gone', startsAt: at(-60), endsAt: at(-20), targetJobs: 999 }),
  ];
  const { repo } = fakeRepo(campaigns, jobsFrom(at(-25), 5));
  const l = await incentivesService.list('user-1', NOW, repo);
  assert.deepEqual(l.active.map((i) => i.id), ['a-soon', 'a-late']);
  assert.deepEqual(l.upcoming.map((i) => i.id), ['up1', 'up2']);
  assert.deepEqual(l.completed.map((i) => i.id), ['done']);
  assert.deepEqual(l.expired.map((i) => i.id), ['gone']);
  assert.deepEqual(l.summary, { activeCount: 2, upcomingCount: 2, completedCount: 1, rewardEarned: 500 });
});

test('list with no campaigns is empty, not an error', async () => {
  const { repo } = fakeRepo([], []);
  const l = await incentivesService.list('user-1', NOW, repo);
  assert.deepEqual([l.active, l.upcoming, l.completed, l.expired], [[], [], [], []]);
  assert.equal(l.summary.rewardEarned, 0);
});

test('progress updates on completion: the next request counts the new job', async () => {
  const { jobs, repo } = fakeRepo([campaign({ targetJobs: 3 })], jobsFrom(at(-9), 2));
  const before = await incentivesService.get('user-1', 'c1', NOW, repo);
  assert.deepEqual([before.completedJobs, before.status], [2, 'active']);
  jobs.push({ completedAt: at(-1), categoryId: null }); // partner completes another job
  const after = await incentivesService.get('user-1', 'c1', NOW, repo);
  assert.deepEqual([after.completedJobs, after.status], [3, 'completed']);
});

test('detail: unknown or switched-off campaign -> 404, no partner profile -> 404', async () => {
  const { repo } = fakeRepo([campaign()], []);
  await assert.rejects(incentivesService.get('user-1', 'missing', NOW, repo), { status: 404 });
  await assert.rejects(incentivesService.get('nobody', 'c1', NOW, repo), { status: 404 });
  await assert.rejects(incentivesService.list('nobody', NOW, repo), { status: 404 });
  await assert.doesNotReject(incentivesService.get('user-1', 'c1', NOW, repo));
});

test('validation: id must be a 24-char hex id, query must be empty', () => {
  assert.equal(idParamSchema.safeParse({ id: 'abc' }).success, false);
  assert.equal(idParamSchema.safeParse({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa' }).success, true);
  assert.equal(idParamSchema.safeParse({ id: 'aaaaaaaaaaaaaaaaaaaaaaaa', x: 1 }).success, false);
  assert.equal(listQuerySchema.safeParse({}).success, true);
  assert.equal(listQuerySchema.safeParse({ partnerId: 'x' }).success, false);
});
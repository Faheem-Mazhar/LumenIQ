import unittest
from datetime import datetime, timezone, timedelta

from app.schemas.business_context import BusinessContext, check_within_range


class TestAgeWithinThreshold(unittest.TestCase):
    def test_none_returns_false(self):
        self.assertFalse(check_within_range(None, 14))

    def test_exactly_at_max_age_boundary(self):
        fixed_now = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        ts = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        self.assertTrue(check_within_range(ts, 14, now=fixed_now))

    def test_one_second_over_boundary(self):
        fixed_now = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        ts = datetime(2025, 1, 1, 11, 59, 59, tzinfo=timezone.utc)
        self.assertFalse(check_within_range(ts, 14, now=fixed_now))

    def test_naive_datetime_treated_as_utc(self):
        fixed_now = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        ts_naive = datetime(2025, 1, 1, 12, 0, 0)
        self.assertTrue(check_within_range(ts_naive, 14, now=fixed_now))


class TestBusinessContextValidity(unittest.TestCase):
    def _minimal_ctx(self, **kwargs):
        base = {"user_id": "u1", "business_id": "b1"}
        base.update(kwargs)
        return BusinessContext(**base)

    def test_are_posts_valid_none(self):
        ctx = self._minimal_ctx(posts_last_scraped=None)
        self.assertFalse(ctx.are_posts_valid(14))

    def test_are_trends_valid_none(self):
        ctx = self._minimal_ctx(trends_last_updated=None)
        self.assertFalse(ctx.are_trends_valid(14))

    def test_are_posts_valid_recent(self):
        ts = datetime.now(timezone.utc) - timedelta(days=1)
        ctx = self._minimal_ctx(posts_last_scraped=ts)
        self.assertTrue(ctx.are_posts_valid(14))

    def test_are_trends_valid_recent(self):
        ts = datetime.now(timezone.utc) - timedelta(days=1)
        ctx = self._minimal_ctx(trends_last_updated=ts)
        self.assertTrue(ctx.are_trends_valid(14))


if __name__ == "__main__":
    unittest.main()

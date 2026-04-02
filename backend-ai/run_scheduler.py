import asyncio
from datetime import datetime, timezone
from semantic_kernel import Kernel
from app.agents.scheduler_agent import SchedulerAgent
from app.schemas.business_context import BusinessContext


# ──────────────────────────────────────────────
#  Test data — update these if testing a different business
# ──────────────────────────────────────────────
BUSINESS_ID = "54eb934a-83b3-4ca4-9caf-8b3575e5d3ff"

# Real business IDs that have content_ideas rows in Supabase
BUSINESS_ID_CHOICES_CAFE  = "c44d860e-f4d4-4f04-9646-b117d4f517bc"   # Choices Cafe YYC
BUSINESS_ID_COLD_MORNINGS = "f61cd8dd-f1cb-4664-bb9f-8a332c90e921"   # Cold Mornings Cafe

# Public test image (square aspect ratio for Instagram)
TEST_IMAGE_URL = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&q=80"

# IMPORTANT: Meta blocks most third-party sample video sites.
# Upload a short .mp4 to Supabase Storage and paste the public URL here.
TEST_VIDEO_URL = "https://wrtchdarqkbjalijviyg.supabase.co/storage/v1/object/public/test/test.mov"  # e.g. "https://your-project.supabase.co/storage/v1/object/public/test-media/clip.mp4"


async def test_schedule_image():
    """Test 1: Schedule an IMAGE post and verify it lands in Supabase."""
    agent = SchedulerAgent(kernel=Kernel())

    print("\n" + "=" * 60)
    print("TEST 1: Schedule an IMAGE post")
    print("=" * 60)

    result = await agent.run(
        action="schedule",
        business_id=BUSINESS_ID,
        caption="Testing image scheduling via run_scheduler.py",
        hashtags=["lumeniq", "test", "coffeepost"],
        scheduled_at=datetime.now(timezone.utc).isoformat(),
        media_type="IMAGE",
        image_url=TEST_IMAGE_URL,
    )

    print(f"  Success:          {result.success}")
    print(f"  Message:          {result.message}")
    print(f"  Calendar Post ID: {result.calendar_post_id}")

    if not result.success:
        print(f"\n  ERROR: {result.message}")
        return None

    print("\n  >>> Check Supabase: calendar_posts should have a new row with status='scheduled'")
    print("  >>> n8n will pick this up and post it to Instagram automatically")
    return result.calendar_post_id


async def test_schedule_reel():
    """Test 2: Schedule a REEL post."""
    agent = SchedulerAgent(kernel=Kernel())

    print("\n" + "=" * 60)
    print("TEST 2: Schedule a REEL post")
    print("=" * 60)

    result = await agent.run(
        action="schedule",
        business_id=BUSINESS_ID,
        caption="Testing reel scheduling via run_scheduler.py",
        hashtags=["lumeniq", "test", "reeltest"],
        scheduled_at=datetime.now(timezone.utc).isoformat(),
        media_type="REELS",
        reel_video_url=TEST_VIDEO_URL,
    )

    print(f"  Success:          {result.success}")
    print(f"  Message:          {result.message}")
    print(f"  Calendar Post ID: {result.calendar_post_id}")

    if not result.success:
        print(f"\n  ERROR: {result.message}")
    return result.calendar_post_id


async def test_reschedule(post_id: str):
    """Test 3: Reschedule an existing post to a new time."""
    agent = SchedulerAgent(kernel=Kernel())

    print("\n" + "=" * 60)
    print(f"TEST 3: Reschedule post {post_id}")
    print("=" * 60)

    new_time = "2026-04-15T14:00:00+00:00"
    result = await agent.run(
        action="reschedule",
        business_id=BUSINESS_ID,
        post_id=post_id,
        scheduled_at=new_time,
    )

    print(f"  Success:          {result.success}")
    print(f"  Message:          {result.message}")
    print(f"  Calendar Post ID: {result.calendar_post_id}")

    if not result.success:
        print(f"\n  ERROR: {result.message}")


async def test_cancel(post_id: str):
    """Test 4: Cancel an existing post (sets status to draft)."""
    agent = SchedulerAgent(kernel=Kernel())

    print("\n" + "=" * 60)
    print(f"TEST 4: Cancel post {post_id}")
    print("=" * 60)

    result = await agent.run(
        action="cancel",
        business_id=BUSINESS_ID,
        post_id=post_id,
    )

    print(f"  Success:          {result.success}")
    print(f"  Message:          {result.message}")
    print(f"  Calendar Post ID: {result.calendar_post_id}")

    if not result.success:
        print(f"\n  ERROR: {result.message}")


async def test_manager_style_schedule(business_id: str, label: str, image_url: str):
    """
    Test 6 & 7: Simulate exactly how manager_agent calls scheduler_agent —
    only context + action are passed. Caption and hashtags are auto-fetched
    from the latest content_idea in Supabase for that business.

    image_url must be passed explicitly here because the content_ideas rows
    currently have empty assets (no image saved yet).
    """
    agent = SchedulerAgent(kernel=Kernel())
    context = BusinessContext(user_id="test-user", business_id=business_id)

    print("\n" + "=" * 60)
    print(f"TEST: Manager-style schedule — {label}")
    print(f"  Business ID: {business_id}")
    print("=" * 60)
    print("  Passing: context + action + image_url only")
    print("  Auto-fetching: caption and hashtags from content_ideas table")

    result = await agent.run(
        context=context,
        action="schedule",
        image_url=image_url,    # provided because assets is empty in these rows
    )

    print(f"\n  Success:          {result.success}")
    print(f"  Message:          {result.message}")
    print(f"  Calendar Post ID: {result.calendar_post_id}")

    if result.success:
        print("\n  >>> Check Supabase calendar_posts — new row should show:")
        print(f"       business_id = {business_id}")
        print("       status      = scheduled")
        print("       caption     = (pulled from content_ideas)")
        print("       hashtags    = (pulled from content_ideas)")
    else:
        print(f"\n  ERROR: {result.message}")

    return result.calendar_post_id


async def main():
    print("=" * 60)
    print("  SCHEDULER AGENT TEST SUITE")
    print("=" * 60)
    print(f"  Business ID:          {BUSINESS_ID}")
    print()

    print("Which test do you want to run?")
    print("  1) Schedule an IMAGE post (n8n will post it!)")
    print("  2) Schedule a REEL post (n8n will post it!)")
    print("  3) Reschedule an existing post")
    print("  4) Cancel an existing post")
    print("  5) Run all tests (schedule image, reschedule it, then cancel it)")
    print("  6) Manager-style: auto-fetch from Choices Cafe content_idea")
    print("  7) Manager-style: auto-fetch from Cold Mornings Cafe content_idea")
    print()

    choice = input("Enter choice (1-7): ").strip()

    if choice == "1":
        await test_schedule_image()

    elif choice == "2":
        await test_schedule_reel()

    elif choice == "3":
        post_id = input("Enter the calendar_post_id to reschedule: ").strip()
        await test_reschedule(post_id)

    elif choice == "4":
        post_id = input("Enter the calendar_post_id to cancel: ").strip()
        await test_cancel(post_id)

    elif choice == "5":
        post_id = await test_schedule_image()
        if post_id:
            await test_reschedule(post_id)
            await test_cancel(post_id)

    elif choice == "6":
        await test_manager_style_schedule(
            business_id=BUSINESS_ID_CHOICES_CAFE,
            label="Choices Cafe YYC",
            image_url=TEST_IMAGE_URL,
        )

    elif choice == "7":
        await test_manager_style_schedule(
            business_id=BUSINESS_ID_COLD_MORNINGS,
            label="Cold Mornings Cafe",
            image_url=TEST_IMAGE_URL,
        )

    else:
        print("Invalid choice.")

    print("\n" + "=" * 60)
    print("  DONE")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

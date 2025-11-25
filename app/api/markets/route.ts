import { NextRequest, NextResponse } from 'next/server';
import { fetchEvents } from '@/lib/polymarket/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') !== 'false';
    const closed = searchParams.get('closed') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tag = searchParams.get('tag') || undefined;

    const events = await fetchEvents({
      active,
      closed,
      limit,
      offset,
      tag_slug: tag,
    });

    // Transform events to a flattened market list with event info
    const markets = events.flatMap((event) =>
      event.markets.map((market) => ({
        ...market,
        event_id: event.id,
        event_slug: event.slug,
        event_title: event.title,
        event_icon: event.icon,
        tags: event.tags,
      }))
    );

    return NextResponse.json({
      events,
      markets,
      count: markets.length,
    });
  } catch (error) {
    console.error('Markets fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    );
  }
}

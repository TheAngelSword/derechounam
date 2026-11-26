-- TikTok videos and Instagram reels added by moderation to a news post.
-- Only the public link is stored; the video plays from the provider's own embed.
alter table news_posts add column if not exists social_url text;

-- Update movie images with local paths
-- This script updates the database to use local image paths instead of external URLs

-- Update movies with downloaded images
UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/the-gioi-moi.thumb.jpg',
    thumbnail_url = '/uploads/images/the-gioi-moi.thumb.jpg',
    local_banner_path = 'images/the-gioi-moi.banner.jpg',
    banner_url = '/uploads/images/the-gioi-moi.banner.jpg'
WHERE id = 46;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/co-nang-ngo-ngao.thumb.jpg',
    thumbnail_url = '/uploads/images/co-nang-ngo-ngao.thumb.jpg',
    local_banner_path = 'images/co-nang-ngo-ngao.banner.jpg',
    banner_url = '/uploads/images/co-nang-ngo-ngao.banner.jpg'
WHERE id = 47;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/thien-ac-quai.thumb.jpg',
    thumbnail_url = '/uploads/images/thien-ac-quai.thumb.jpg',
    local_banner_path = 'images/thien-ac-quai.banner.jpg',
    banner_url = '/uploads/images/thien-ac-quai.banner.jpg'
WHERE id = 48;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/7-ngay-dia-nguc.thumb.jpg',
    thumbnail_url = '/uploads/images/7-ngay-dia-nguc.thumb.jpg',
    local_banner_path = 'images/7-ngay-dia-nguc.banner.jpg',
    banner_url = '/uploads/images/7-ngay-dia-nguc.banner.jpg'
WHERE id = 49;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/dieced-reloaded.thumb.jpg',
    thumbnail_url = '/uploads/images/dieced-reloaded.thumb.jpg',
    local_banner_path = 'images/dieced-reloaded.banner.jpg',
    banner_url = '/uploads/images/dieced-reloaded.banner.jpg'
WHERE id = 50;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/las-nubes.thumb.jpg',
    thumbnail_url = '/uploads/images/las-nubes.thumb.jpg',
    local_banner_path = 'images/las-nubes.banner.jpg',
    banner_url = '/uploads/images/las-nubes.banner.jpg'
WHERE id = 51;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/bad-man.thumb.jpg',
    thumbnail_url = '/uploads/images/bad-man.thumb.jpg',
    local_banner_path = 'images/bad-man.banner.jpg',
    banner_url = '/uploads/images/bad-man.banner.jpg'
WHERE id = 52;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/y-nu-bong-dem.thumb.jpg',
    thumbnail_url = '/uploads/images/y-nu-bong-dem.thumb.jpg',
    local_banner_path = 'images/y-nu-bong-dem.banner.jpg',
    banner_url = '/uploads/images/y-nu-bong-dem.banner.jpg'
WHERE id = 43;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/diep-vien-bat-dac-di.thumb.jpg',
    thumbnail_url = '/uploads/images/diep-vien-bat-dac-di.thumb.jpg',
    local_banner_path = 'images/diep-vien-bat-dac-di.banner.jpg',
    banner_url = '/uploads/images/diep-vien-bat-dac-di.banner.jpg'
WHERE id = 44;

UPDATE dbo.movies 
SET 
    local_thumbnail_path = 'images/song.thumb.jpg',
    thumbnail_url = '/uploads/images/song.thumb.jpg',
    local_banner_path = 'images/song.banner.jpg',
    banner_url = '/uploads/images/song.banner.jpg'
WHERE id = 45;

-- Show updated movies
SELECT id, title, thumbnail_url, banner_url, local_thumbnail_path, local_banner_path 
FROM dbo.movies 
WHERE id IN (43, 44, 45, 46, 47, 48, 49, 50, 51, 52)
ORDER BY id;

# SnapShare Photo App: Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing app where users upload photos and view a feed containing photos from people they follow.

The starting facts and assumptions are:

- Registered users: 10,000,000.
- Daily active users (DAU): 10% of registered users.
- Each daily active user uploads one photo per day.
- Each daily active user views 50 feed pages per day.
- Average original photo size: 2 MB.
- Each photo also has a 50 KB thumbnail.
- A day has 86,400 seconds, and a year has 365 days.
- Average request rates are calculated across all 24 hours; actual traffic varies throughout the day.
- Peak feed traffic is estimated at five times the average rate.
- Photos and thumbnails are retained for a full year, and storage estimates exclude backups, replicas, metadata, and other overhead.

### Daily active users

Daily active users = 10,000,000 × 10%

**Daily active users = 1,000,000 users.**

## 2. Traffic and storage estimates

### Uploads per second

Each daily active user uploads one photo per day.

- Daily uploads = 1,000,000 × 1 = 1,000,000 photos.
- Average uploads per second = 1,000,000 ÷ 86,400.

**Average upload rate ≈ 11.6 photos per second.**

### Feed views per second

Each daily active user views 50 feed pages per day.

- Daily feed views = 1,000,000 × 50 = 50,000,000 views.
- Average feed views per second = 50,000,000 ÷ 86,400 ≈ 579.
- Peak feed views per second = 579 × 5 ≈ 2,895.

**Average feed rate ≈ 579 views per second.**

**Estimated peak feed rate ≈ 2,900 views per second.**

These are planning estimates, not guaranteed limits; actual traffic may be uneven or bursty.

### Photo storage per year

Original photos:

- Daily storage = 1,000,000 × 2 MB = 2,000,000 MB, or 2 TB.
- Annual storage = 2 TB × 365 = **730 TB per year**.

Thumbnails:

- Daily thumbnail storage = 1,000,000 × 50 KB = 50,000,000 KB, or approximately 50 GB.
- Annual thumbnail storage = 50 GB × 365 = **18.25 TB per year**.

Total new photo and thumbnail storage is approximately **748.25 TB per year**, using decimal units.

This is the amount of new data added in a year, before backups, replication, storage overhead, and any growth in usage.

## 3. Read-heavy or write-heavy?

SnapShare is a **read-heavy system** because users generate about 50 million feed views per day but only 1 million photo uploads per day. That is approximately 50 feed views for every upload.

The design should therefore prioritize fast feed loading and efficient delivery of photos. A CDN, caching, and a database read replica help handle frequent reads without putting all the work on the primary database. Upload processing should also be asynchronous so that thumbnail generation does not slow down the user's upload experience.

## 4. Why photos should not be stored inside the database

Photo files are large binary objects that would make the database grow quickly, consume expensive database storage, and increase backup and query costs. Instead, original photos and thumbnails should be stored in **object storage**, while the database stores their URLs or object keys along with metadata such as the owner, caption, upload time, and visibility.

Object storage is designed for large files and can scale independently of the database. A CDN can cache and deliver frequently requested images from locations closer to users.

## 5. Architecture diagram

```text
                         +----------------------+
                         |        Users         |
                         +----------+-----------+
                                    |
                         Feed reads | Photo uploads
                                    |
                         +----------v-----------+
                         |          CDN         |
                         | Cached images/feed   |
                         +----------+-----------+
                                    |
                         +----------v-----------+
                         |     Load Balancer    |
                         +----------+-----------+
                                    |
                     +--------------+--------------+
                     |                             |
            +--------v---------+          +--------v---------+
            |   App Server 1   |          |   App Server 2   |
            +--------+---------+          +--------+---------+
                     |                             |
                     +--------------+--------------+
                                    |
                         +----------v-----------+
                         |         Cache        |
                         | Feed and hot metadata|
                         +----------+-----------+
                                    |
                         +----------v-----------+
                         |   Primary Database   |
                         | Users, posts, follows|
                         +----------+-----------+
                                    |
                         Replication to read copy
                                    |
                         +----------v-----------+
                         |    Read Replica      |
                         | Feed and read queries|
                         +----------------------+

   Original photo upload
            |
            v
   +--------------------+       +--------------------+
   |   Object Storage   |<------| Thumbnail Worker   |
   | Originals + thumbs|       +---------+----------+
   +---------+----------+                 ^
             |                            |
             +--------------------+       |
                                  |       |
                         +--------v-------+--------+
                         |       Job Queue         |
                         | Thumbnail tasks pending |
                         +-------------------------+
```

The CDN serves cached image content, while app servers handle application requests; the app servers can communicate with object storage and the queue directly. Feed reads can use the cache and read replica, while writes go to the primary database.

## 6. What each component solves

- **CDN:** Delivers cached photos and thumbnails close to users, reducing latency and load on the origin services.
- **Load balancer:** Distributes incoming application requests across healthy app servers to prevent one server from becoming a bottleneck.
- **App servers:** Authenticate users, enforce permissions, manage uploads and feed requests, and coordinate database and storage operations.
- **Cache:** Keeps frequently accessed feed data and metadata in fast memory to reduce repeated database queries.
- **Primary database:** Reliably stores structured records such as users, posts, follows, and photo object keys.
- **Read replica:** Handles read queries separately from writes, reducing read pressure on the primary database.
- **Object storage:** Stores original photo files and generated thumbnails without filling the relational database with large binary files.
- **Job queue:** Holds thumbnail-generation tasks so uploads can finish without waiting for image processing.
- **Thumbnail worker:** Processes queued jobs, creates smaller versions of photos, and saves the thumbnails to object storage.

## 7. Step-by-step photo upload flow

1. The user signs in and selects a photo to upload.
2. The app server authenticates the user, validates the request, and creates a post record or upload session as appropriate.
3. The app server issues a short-lived, permission-limited upload URL for object storage.
4. The user's device uploads the original photo to object storage using that URL.
5. After the upload succeeds, the application confirms the upload and records or updates the photo's object key, owner, and status in the primary database.
6. The application adds a thumbnail-generation job to the queue, identifying the original photo and the destination for the thumbnail.
7. A thumbnail worker takes the job, downloads or reads the original image, resizes it, and creates a thumbnail of approximately 50 KB.
8. The worker saves the thumbnail in object storage and updates the photo's metadata or processing status in the database.
9. When users request a feed, app servers retrieve post metadata from the cache or read replica and return photo URLs.
10. The CDN serves cached thumbnails and photos; if an image is not cached, it retrieves the object from storage and can cache it for subsequent requests.

If thumbnail processing fails, the job can be retried and monitored rather than forcing the user to upload the photo again.

## 8. Trade-offs

### Trade-off 1: CDN caching versus fresh content

**Benefit:** Caching reduces latency, bandwidth costs, and the load on object storage.

**Cost:** Newly uploaded photos or changed permissions may not appear immediately if cached content is stale. Cache invalidation, short-lived caching for sensitive content, and correct access controls are needed.

### Trade-off 2: Read replicas versus immediate consistency

**Benefit:** Read replicas distribute feed queries and allow the primary database to focus on writes.

**Cost:** Replication can lag behind the primary database, so a new post may not immediately appear in every feed query. The app can briefly read recent writes from the primary database or show a pending state when immediate visibility matters.

### Trade-off 3: Asynchronous thumbnails versus processing delay

**Benefit:** A queue and background worker keep image processing from slowing down uploads and allow workers to scale independently.

**Cost:** Thumbnails may not be ready immediately, and jobs can fail or be processed more than once. The system needs retries, monitoring, and idempotent workers that can safely repeat a job.

### Trade-off 4: Object storage versus operational complexity

**Benefit:** Object storage scales to large amounts of photo data without making the relational database enormous.

**Cost:** The application must manage file permissions, object keys, upload failures, and consistency between database records and stored files.

## Conclusion

SnapShare has 1 million daily active users, averages approximately 11.6 photo uploads per second and 579 feed views per second, and is expected to add about 748.25 TB of original photos and thumbnails per year. Because it is read-heavy, its architecture should emphasize CDN delivery, caching, and read replicas, while object storage and asynchronous thumbnail processing handle photo files efficiently.

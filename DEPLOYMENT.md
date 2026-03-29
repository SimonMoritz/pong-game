# Deployment

This project is deployed as a static site from `public/` using DigitalOcean Spaces and the built-in Spaces CDN.

The old Docker + self-hosted TLS deployment path is obsolete for this repo. The browser app does not need Node, Express, or a container in production.

## Hosting Shape

- Upload the contents of `public/` to a DigitalOcean Spaces bucket.
- Enable the Spaces CDN for that bucket.
- Serve the site from a custom CDN subdomain such as `www.example.com`.
- Redirect the apex domain `example.com` to `www.example.com`.

This setup matches the app architecture:

- [`public/index.html`](/home/simon/pong-game/public/index.html) is the entrypoint.
- All runtime code is static browser code under [`public/`](/home/simon/pong-game/public).
- There is no backend API or server-side rendering requirement.

## Recommended DigitalOcean Setup

Use the following shape in DigitalOcean:

- Create a `Spaces Standard Storage` bucket.
- Keep file listing private.
- Enable the Spaces CDN on that bucket.
- Configure a custom CDN subdomain such as `www.example.com`.
- Use a DigitalOcean-managed TLS certificate for the custom subdomain.

Use `Standard Storage`, not `Cold Storage`. DigitalOcean documents that Cold Storage does not support CDN integration or custom CDN endpoints.

## Domain Setup

The low-risk setup for Spaces CDN is a custom subdomain:

- `www.example.com` -> Spaces CDN custom endpoint
- `example.com` -> redirect to `https://www.example.com`

This is preferable to serving the site directly from the apex through Spaces because DigitalOcean documents custom CDN subdomains, and this keeps the DNS setup straightforward.

## Required GitHub Secrets And Variables

The GitHub Actions workflow expects these repository settings:

### Secrets

- `DIGITALOCEAN_ACCESS_TOKEN`
  - Personal access token used by `doctl` to purge the CDN cache.
- `DO_SPACES_ACCESS_KEY_ID`
  - Spaces access key with write access to the target bucket.
- `DO_SPACES_SECRET_ACCESS_KEY`
  - Secret for the Spaces access key.

### Variables

- `DO_SPACES_BUCKET`
  - The Spaces bucket name.
- `DO_SPACES_REGION`
  - The bucket region, for example `fra1` or `ams3`.
- `DO_CDN_ID`
  - The Spaces CDN endpoint ID used by `doctl compute cdn flush`.

## Manual Bucket And CDN Setup

1. Create a Spaces bucket in the region closest to your audience.
2. Enable the CDN on that bucket.
3. Set the CDN TTL. `3600` seconds is a reasonable starting point.
4. Configure a custom CDN subdomain such as `www.example.com`.
5. Create the required DNS record for the custom subdomain.
6. Configure an apex redirect from `example.com` to `www.example.com`.

## Deployment Behavior

The workflow deploys only the static site:

- Runs `node --test`
- Syncs `public/` to the Spaces bucket
- Uploads `index.html` again with a shorter cache policy
- Flushes the Spaces CDN cache

The workflow uses the AWS CLI against the Spaces S3-compatible endpoint:

```bash
aws s3 sync public/ "s3://${DO_SPACES_BUCKET}" \
    --delete \
    --acl public-read \
    --endpoint-url "https://${DO_SPACES_REGION}.digitaloceanspaces.com"
```

## Cache Strategy

This repo does not currently use fingerprinted asset filenames. Files like `main.js` and `styles.css` keep stable names between deploys.

Because of that:

- `index.html` should have a short cache lifetime.
- Static assets should have a moderate cache lifetime.
- The CDN cache should be flushed after each deploy.

The current workflow applies:

- `index.html`: `public, max-age=60, must-revalidate`
- other deployed files: `public, max-age=3600`

This is a safe initial setup. If the repo later adopts hashed asset filenames, asset cache times can be increased significantly.

## Notes

- The production artifact is `public/`, not the repo root.
- [`server.js`](/home/simon/pong-game/server.js) and [`Dockerfile`](/home/simon/pong-game/Dockerfile) are no longer part of the primary production deployment story.
- Local development remains unchanged. Any static file server works.

## References

- DigitalOcean Spaces quickstart: https://docs.digitalocean.com/products/spaces/getting-started/quickstart/
- Enable Spaces CDN: https://docs.digitalocean.com/products/spaces/how-to/enable-cdn/
- Manage Spaces CDN cache: https://docs.digitalocean.com/products/spaces/how-to/manage-cdn-cache/
- Spaces S3 compatibility: https://docs.digitalocean.com/products/spaces/reference/s3-compatibility/
- Spaces API reference: https://docs.digitalocean.com/reference/api/spaces/

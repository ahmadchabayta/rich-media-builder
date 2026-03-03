/** GROQ query constants shared across API routes and the cloud hook. */

/** All projects — overview fields only (no snapshotJson — too large). */
export const ALL_PROJECTS_QUERY = `
  *[_type == "adProject"] | order(_updatedAt desc) {
    _id,
    _updatedAt,
    title,
    status,
    format,
    client,
    adSizeW,
    adSizeH,
    publishDate,
    endDate,
    platforms,
    tags,
    "thumbnailUrl": thumbnail.asset->url,
    "campaignName": campaign->name
  }
`;

/** Single project — includes snapshotJson. */
export const PROJECT_BY_ID_QUERY = `
  *[_type == "adProject" && _id == $id][0] {
    _id,
    _updatedAt,
    title,
    status,
    format,
    client,
    adSizeW,
    adSizeH,
    publishDate,
    endDate,
    platforms,
    audience,
    tags,
    notes,
    snapshotJson,
    snapshotVersion,
    "thumbnailUrl": thumbnail.asset->url,
    "campaignName": campaign->name
  }
`;

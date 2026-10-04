import "server-only";

export type HomeDrmPublicConfig = {
  enabled: boolean;
  dashManifestUrl: string;
  hlsManifestUrl: string;
  widevineLicenseUrl: string;
  playReadyLicenseUrl: string;
  fairPlayLicenseUrl: string;
  fairPlayCertificateUrl: string;
  fallbackImageUrl: string;
};

export function getHomeDrmPublicConfig(): HomeDrmPublicConfig {
  const dashManifestUrl = process.env.HOME_DRM_DASH_MANIFEST_URL?.trim() ?? "";
  const hlsManifestUrl = process.env.HOME_DRM_HLS_MANIFEST_URL?.trim() ?? "";
  const hasWidevine = Boolean(process.env.HOME_DRM_WIDEVINE_LICENSE_URL?.trim());
  const hasPlayReady = Boolean(process.env.HOME_DRM_PLAYREADY_LICENSE_URL?.trim());
  const hasFairPlay = Boolean(process.env.HOME_DRM_FAIRPLAY_LICENSE_URL?.trim());
  const hasManifest = Boolean(dashManifestUrl || hlsManifestUrl);

  return {
    enabled: hasManifest && (hasWidevine || hasPlayReady || hasFairPlay),
    dashManifestUrl,
    hlsManifestUrl,
    widevineLicenseUrl: hasWidevine ? "/api/home-drm/license?system=widevine" : "",
    playReadyLicenseUrl: hasPlayReady ? "/api/home-drm/license?system=playready" : "",
    fairPlayLicenseUrl: hasFairPlay ? "/api/home-drm/license?system=fairplay" : "",
    fairPlayCertificateUrl: process.env.HOME_DRM_FAIRPLAY_CERT_URL?.trim() ? "/api/home-drm/fairplay-cert" : "",
    fallbackImageUrl: process.env.HOME_DRM_FALLBACK_IMAGE_URL?.trim() ?? ""
  };
}

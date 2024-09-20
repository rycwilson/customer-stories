
DEV_TUNNEL_SUBDOMAIN = "cspdev"
DEMO_COMPANY_ID = 24
SAMPLE_COMPANY_ID = 10  # varmour

INDUSTRIES = ['Education', 'Government', 'Financial Services', 'Healthcare', 'Hospitality', 'Manufacturing', 'Media and Entertainment', 'Service Provider', 'Technology', 'IT', 'Telecommunications'];

# LOGO_PLACEHOLDER_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/shared/logo-placeholder.png"
LOGO_PLACEHOLDER = 'placeholders/logo-placeholder.png'

# Google Ads
ADWORDS_CSP_TEST_MANAGER_CUSTOMER_ID = '811-996-7666'
ADWORDS_CSP_TEST_CLIENT_CUSTOMER_ID = '266-136-8280'
ADWORDS_CSP_PRODUCTION_MANAGER_CUSTOMER_ID = '569-145-2274'
ADWORDS_CSP_PRODUCTION_CLIENT_CUSTOMER_ID = '836-316-8926'

RESPONSIVE_AD_SHORT_HEADLINE_MAX = 30
RESPONSIVE_AD_LONG_HEADLINE_MAX = 90
RESPONSIVE_AD_MAX_MARKETING_IMAGES = 15
RESPONSIVE_AD_MAX_LOGOS = 5
RESPONSIVE_AD_ASPECT_RATIO_TOLERANCE = 0.01
RESPONSIVE_AD_SQUARE_IMAGE_MIN = 300
RESPONSIVE_AD_SQUARE_IMAGE_PLACEHOLDER = 'placeholders/300x300.png'
RESPONSIVE_AD_LANDSCAPE_IMAGE_ASPECT_RATIO = 1.91
RESPONSIVE_AD_LANDSCAPE_IMAGE_MIN = '600x314'
RESPONSIVE_AD_LANDSCAPE_IMAGE_PLACEHOLDER = 'placeholders/600x314.png'
RESPONSIVE_AD_SQUARE_LOGO_MIN = 128
RESPONSIVE_AD_SQUARE_LOGO_PLACEHOLDER = 'placeholders/128x128.png'
RESPONSIVE_AD_LANDSCAPE_LOGO_ASPECT_RATIO = 4
RESPONSIVE_AD_LANDSCAPE_LOGO_MIN = '512x128'
RESPONSIVE_AD_LANDSCAPE_LOGO_PLACEHOLDER = 'placeholders/512x128.png'

# the parameters can be hard-coded here because this will be used in a simple re-direct
CURATOR_LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization?\
                               client_id=#{ENV['LINKEDIN_KEY']}&\
                               response_type=code&\
                               scope=r_basicprofile%20w_member_social&\
                               state=#{ENV['LINKEDIN_STATE']}".gsub(/\s+/, '')
                               # redirect_uri=  included by application#linkedin_auth

CONTRIBUTOR_LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization?\
                                  client_id=#{ENV['LINKEDIN_KEY']}&\
                                  response_type=code&\
                                  scope=r_liteprofile&\
                                  state=#{ENV['LINKEDIN_STATE']}".gsub(/\s+/, '')

# LINKEDIN_AUTHORIZE_BASE_URL = "https://www.linkedin.com/oauth/v2/authorization?\
#                                client_id=#{ENV['LINKEDIN_KEY']}&\
#                                response_type=code&\
#                                scope=r_basicprofile%20w_member_social%20rw_company_admin\
#                                state=#{ENV['LINKEDIN_STATE']}&".gsub(/\s+/, '')
                               # redirect_uri=  included by profile/contributions controller

# separate url needed for companies because specifics information is displayed
# "Pixlee would like to access your data..."
# CONTRIBUTOR_LINKEDIN_AUTH_URL =
# PIXLEE_LINKEDIN_AUTHORIZE_BASE_URL = "https://www.linkedin.com/oauth/v2/authorization?\
#                                       client_id=#{ ENV['PIXLEE_LINKEDIN_KEY'] }&\
#                                       response_type=code&\
#                                       scope=r_liteprofile%20w_share%20w_member_social&\
#                                       state=#{ENV['LINKEDIN_STATE']}&".gsub(/\s+/, '')

FACEBOOK_SHARE_WINDOW_WIDTH = 600
FACEBOOK_SHARE_WINDOW_HEIGHT = 424
TWITTER_SHARE_WINDOW_WIDTH = 500
TWITTER_SHARE_WINDOW_HEIGHT = 446
LINKEDIN_SHARE_WINDOW_WIDTH = 550
LINKEDIN_SHARE_WINDOW_HEIGHT = 540

# the parameters must be defined in the typhoeus request
LINKEDIN_TOKEN_BASE_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_PROFILES_BASE_URL = "https://api.linkedin.com/v2/me"
LINKEDIN_PROFILE_JS = "https://platform.linkedin.com/badges/js/profile.js"

LINKEDIN_SHARE_URL = "https://www.linkedin.com/shareArticle?mini=true&url="
TWITTER_SHARE_URL = "https://twitter.com/share?url="
FACEBOOK_SHARE_URL = "https://www.facebook.com/sharer.php?u="
FACEBOOK_APP_ID = "291034101286863"

GETCLICKY_API_BASE_URL = "http://api.clicky.com/api/stats/4"
GETCLICKY_TRACKING_URL = "http://in.getclicky.com/in.php"

YOUTUBE_BASE_URL = "https://www.youtube.com/embed/"
VIMEO_BASE_URL = "https://player.vimeo.com/video/"
WISTIA_BASE_URL = "https://fast.wistia.com/embed/medias/"

# CS_FULL_LOGO_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cs_logo_full_1200x630.png"
CSP_FULL_LOGO = 'cs_logo_full_1200x630.png'

# TRUNITY_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/trunity/trunity_400x400.png"
# TRUNITY_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/trunity/trunity_300x160.png"

# COMPAS_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/compas/compas_400x400.png"
# COMPAS_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/compas/compas_300x160.png"

# COREFACT_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/corefact/corefact_400x400.png"
# COREFACT_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/corefact/corefact_300x160.png"

# VARMOUR_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/varmour/varmour_400x400.png"
# VARMOUR_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/varmour/varmour_300x160.png"

# ZOOM_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zoom/zoom_400x400.png"
# ZOOM_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zoom/zoom_300x160.png"

# SAUCELABS_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/saucelabs/saucelabs_400x400.png"
# SAUCELABS_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/saucelabs/saucelabs_300x160.png"

# CCE_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cce/cce_400x400.png"
# CCE_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cce/cce_300x160.png"

# ZENIQ_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zeniq/zeniq_400x400.png"
# ZENIQ_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zeniq/zeniq_300x160.png"

# RETAILNEXT_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/retailnext/retailnext_400x400.png"
# RETAILNEXT_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/retailnext/retailnext_300x160.png"

# SPP_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/spp/spp_400x400.jpeg"
# SPP_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/spp/spp_300x160.png"

# PIXLEE_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/pixlee/pixlee_400x400.png"
# PIXLEE_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/pixlee/pixlee_300x160.png"
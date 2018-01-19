
INDUSTRIES = ['Education', 'Government', 'Financial Services', 'Healthcare', 'Hospitality', 'Manufacturing', 'Media and Entertainment', 'Service Provider', 'Technology', 'IT', 'Telecommunications'];

LOGO_PLACEHOLDER_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/shared/logo-placeholder.png"

# AdWords accounts
ADWORDS_CSP_TEST_MANAGER_CUSTOMER_ID = '811-996-7666'
ADWORDS_CSP_TEST_CLIENT_CUSTOMER_ID = '266-136-8280'
ADWORDS_CSP_PRODUCTION_MANAGER_CUSTOMER_ID = '569-145-2274'
ADWORDS_CSP_PRODUCTION_CLIENT_CUSTOMER_ID = '836-316-8926'

# the parameters can be hard-coded here because this will be used in a simple re-direct
LINKEDIN_AUTHORIZE_BASE_URL = "https://www.linkedin.com/oauth/v2/authorization?\
                               client_id=#{ENV['LINKEDIN_KEY']}&\
                               response_type=code&\
                               scope=r_basicprofile&\
                               state=#{ENV['LINKEDIN_STATE']}&".gsub(/\s+/, '')
                               # redirect_uri=  included by profile/contributions controller

# the parameters must be defined in the typhoeus request (see profile controller)
LINKEDIN_GETTOKEN_BASE_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_PEOPLE_BASE_URL = "https://api.linkedin.com/v1/people/~"

LINKEDIN_SHARE_URL = "//www.linkedin.com/shareArticle?mini=true&url="
TWITTER_SHARE_URL = "//twitter.com/share?url="
FACEBOOK_SHARE_URL = "//www.facebook.com/sharer.php?u="

GETCLICKY_API_BASE_URL = "http://api.clicky.com/api/stats/4"
GETCLICKY_TRACKING_URL = "http://in.getclicky.com/in.php"

YOUTUBE_BASE_URL = "https://www.youtube.com/embed/"
VIMEO_BASE_URL = "https://player.vimeo.com/video/"
WISTIA_BASE_URL = "https://fast.wistia.com/embed/medias/"

ADWORDS_IMAGE_PLACEHOLDER_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/adwords/adwords_image_placeholder.png"

CS_LOGO_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cs_logo.png"
CS_FULL_LOGO_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cs_logo_full_1200x630.png"
CS_POWERED_LOGO_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/CS-powered-by.png"

TRUNITY_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/trunity/trunity_400x400.png"
TRUNITY_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/trunity/trunity_300x160.png"

COMPAS_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/compas/compas_400x400.png"
COMPAS_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/compas/compas_300x160.png"

COREFACT_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/corefact/corefact_400x400.png"
COREFACT_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/corefact/corefact_300x160.png"

VARMOUR_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/varmour/varmour_400x400.png"
VARMOUR_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/varmour/varmour_300x160.png"

ZOOM_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zoom/zoom_400x400.png"
ZOOM_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zoom/zoom_300x160.png"

SAUCELABS_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/saucelabs/saucelabs_400x400.png"
SAUCELABS_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/saucelabs/saucelabs_300x160.png"

CCE_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cce/cce_400x400.png"
CCE_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/cce/cce_300x160.png"

ZENIQ_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zeniq/zeniq_400x400.png"
ZENIQ_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/zeniq/zeniq_300x160.png"

RETAILNEXT_400X400_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/retailnext/retailnext_400x400.png"
RETAILNEXT_300X160_URL = "https://s3-us-west-1.amazonaws.com/csp-production-assets/retailnext/retailnext_300x160.png"


# TODO Post-install message from doorkeeper:
# Starting from 5.5.0 RC1 Doorkeeper requires client authentication for Resource Owner Password Grant
# as stated in the OAuth RFC. You have to create a new OAuth client (Doorkeeper::Application) if you didn't
# have it before and use client credentials in HTTP Basic auth if you previously used this grant flow without
# client authentication.

# To opt out of this you could set the "skip_client_authentication_for_password_grant" configuration option
# to "true", but note that this is in violation of the OAuth spec and represents a security risk.

# Read https://github.com/doorkeeper-gem/doorkeeper/issues/561#issuecomment-612857163 for more details.
#
Doorkeeper.configure do
  Devise::Doorkeeper.configure_doorkeeper(self)

  # Change the ORM that doorkeeper will use (needs plugins)
  orm :active_record

  # This block will be called to check whether the resource owner is authenticated or not.
  resource_owner_authenticator do
    # ref: https://stackoverflow.com/questions/14504739
    if current_user
      current_user
    else
      session[:user_return_to] = request.original_url
      warden.authenticate!(:scope => :user)
    end
  end

  # If you want to restrict access to the web interface for adding oauth authorized applications, you need to declare the block below.
  admin_authenticator do
    # Put your admin authentication logic here.
    # Example implementation:
    current_admin || warden.authenticate!(:scope => :admin)
  end

  # Authorization Code expiration time (default 10 minutes).
  # authorization_code_expires_in 10.minutes

  # Access token expiration time (default 2 hours).
  # If you want to disable expiration, set this to nil.
  access_token_expires_in nil    # 2.hours

  # Assign a custom TTL for implicit grants.
  # custom_access_token_expires_in do |oauth_client|
  #   oauth_client.application.additional_settings.implicit_oauth_expiration
  # end

  # Use a custom class for generating the access token.
  # https://github.com/doorkeeper-gem/doorkeeper#custom-access-token-generator
  # access_token_generator '::Doorkeeper::JWT'

  # The controller Doorkeeper::ApplicationController inherits from.
  # Defaults to ActionController::Base.
  # https://github.com/doorkeeper-gem/doorkeeper#custom-base-controller
  # base_controller 'ApplicationController'

  # Reuse access token for the same resource owner within an application (disabled by default)
  # Rationale: https://github.com/doorkeeper-gem/doorkeeper/issues/383
  # reuse_access_token

  # Issue access tokens with refresh token (disabled by default)
  # use_refresh_token

  # Provide support for an owner to be assigned to each registered application (disabled by default)
  # Optional parameter confirmation: true (default false) if you want to enforce ownership of
  # a registered application
  # Note: you must also run the rails g doorkeeper:application_owner generator to provide the necessary support
  # enable_application_owner confirmation: false

  # Define access token scopes for your provider
  # For more information go to
  # https://github.com/doorkeeper-gem/doorkeeper/wiki/Using-Scopes
  default_scopes  :curator
  # optional_scopes :write, :update

  # Change the way client credentials are retrieved from the request object.
  # By default it retrieves first from the `HTTP_AUTHORIZATION` header, then
  # falls back to the `:client_id` and `:client_secret` params from the `params` object.
  # Check out https://github.com/doorkeeper-gem/doorkeeper/wiki/Changing-how-clients-are-authenticated
  # for more information on customization
  # client_credentials :from_basic, :from_params

  # Change the way access token is authenticated from the request object.
  # By default it retrieves first from the `HTTP_AUTHORIZATION` header, then
  # falls back to the `:access_token` or `:bearer_token` params from the `params` object.
  # Check out https://github.com/doorkeeper-gem/doorkeeper/wiki/Changing-how-clients-are-authenticated
  # for more information on customization
  # access_token_methods :from_bearer_authorization, :from_access_token_param, :from_bearer_param

  # Change the native redirect uri for client apps
  # When clients register with the following redirect uri, they won't be redirected to any server and the authorization code will be displayed within the provider
  # The value can be any string. Use nil to disable this feature. When disabled, clients must provide a valid URL
  # (Similar behaviour: https://developers.google.com/accounts/docs/OAuth2InstalledApp#choosingredirecturi)
  #

  # deprecated
  # native_redirect_uri 'urn:ietf:wg:oauth:2.0:oob'

  # Forces the usage of the HTTPS protocol in non-native redirect uris (enabled
  # by default in non-development environments). OAuth2 delegates security in
  # communication to the HTTPS protocol so it is wise to keep this enabled.
  #
  # Callable objects such as proc, lambda, block or any object that responds to
  # #call can be used in order to allow conditional checks (to allow non-SSL
  # redirects to localhost for example).
  #
  # force_ssl_in_redirect_uri !Rails.env.development?
  #
  # force_ssl_in_redirect_uri { |uri| uri.host != 'localhost' }

  # Specify what redirect URI's you want to block during creation. Any redirect
  # URI is whitelisted by default.
  #
  # You can use this option in order to forbid URI's with 'javascript' scheme
  # for example.
  #
  # forbid_redirect_uri { |uri| uri.scheme.to_s.downcase == 'javascript' }

  # Specify what grant flows are enabled in array of Strings. The valid
  # strings and the flows they enable are:
  #
  # "authorization_code" => Authorization Code Grant Flow
  # "implicit"           => Implicit Grant Flow
  # "password"           => Resource Owner Password Credentials Grant Flow
  # "client_credentials" => Client Credentials Grant Flow
  #
  # If not specified, Doorkeeper enables authorization_code and
  # client_credentials.
  #
  # implicit and password grant flows have risks that you should understand
  # before enabling:
  #   http://tools.ietf.org/html/rfc6819#section-4.4.2
  #   http://tools.ietf.org/html/rfc6819#section-4.4.3
  #
  # grant_flows %w[authorization_code client_credentials]

  # Under some circumstances you might want to have applications auto-approved,
  # so that the user skips the authorization step.
  # For example if dealing with a trusted application.
  # skip_authorization do |resource_owner, client|
  #   client.superapp? or resource_owner.admin?
  # end

  # WWW-Authenticate Realm (default "Doorkeeper").
  # realm "Doorkeeper"
end

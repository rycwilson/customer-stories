# frozen_string_literal: true

# NOTE: request.env['warden'].user(:user) # handy if the current_user is needed

Rails.application.routes.default_url_options = {
  protocol: Rails.env.production? ? 'https' : 'http',
  host: ENV['HOST_NAME']
}

Rails.application.routes.draw do
  root 'site#landing', constraints: { subdomain: '' }
  get(
    '/:page',
    to: 'site#landing',
    constraints: { subdomain: '', page: /product|plans|company|team|terms|privacy|our-story/ }
  )

  # get '/sitemap', to: 'site#sitemap'
  # get '/:google', to: 'site#google_verify', constraints: { google: /google\w+/ }

  put '/contributions/:token', to: 'contributions#update', constraints: { subdomain: '' }

  constraints(->(req) { req.subdomain.blank? or CompanySubdomain.matches?(req) }) do
    draw :devise_routes
  end

  authenticate(:user) do
    # draw :zapier_routes
    get('/settings', to: 'companies#new', as: 'new_company', constraints: { subdomain: '' })
    post('/settings', to: 'companies#create', as: 'companies', constraints: { subdomain: '' })
  end

  constraints(CompanySubdomain) do
    draw :company_routes

    constraints(PublishedStoryPathConstraint) do
      # get(
      #   '/:customer/:title',
      #   to: 'stories#track',
      #   constraints: -> (request) { request.query_parameters[:track].present? }
      # )
      get '/:customer/(:product)/:title', to: 'stories#show', as: 'published_story'
      get '/:random_string', to: 'stories#show', hidden_link: true
    end
  end

  # NOTE: parends ensure root path matches (for unfound subdomains)
  get '(*all)', to: 'site#not_found', via: :all
end

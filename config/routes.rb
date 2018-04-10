#
# this comes in handy if the current_user is needed
# request.env['warden'].user(:user)
#
Rails.application.routes.default_url_options = {
  protocol: Rails.env.development? ? 'http' : 'https',
  host: ENV['HOST_NAME']
}

Rails.application.routes.draw do

  devise_for :admins
  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

  use_doorkeeper

  # zapier
  authenticate(:user) do
    get '/auth-test', to: 'application#auth_test'
    get '/curators', to: 'companies#get_curators'
    get '/invitation_templates', to: 'companies#get_invitation_templates'
    post '/successes', to: 'successes#create', constraints: { zap: 'true' }
  end

  get '/sitemap', to: 'site#sitemap'
  get '/:google', to: 'site#google_verify', constraints: { google: /google\w+/ }

  # admins only
  get '/switch_user', to: 'switch_user#set_current_user'
  get '/switch_user/remember_user', to: 'switch_user#remember_user'

  # sendgrid events (currently tracking open and click)
  post '/esp/notifications', to: 'site#esp_notifications'

  # constraints(DevSubdomain) do
  #   authenticate(:user) do
  #     get '/auth-test', to: 'application#auth_test'
  #     post '/successes', to: 'successes#create', constraints: { zap: 'true' }
  #   end
  #   # need to pick up on devise routes here, without doing so explicitly
  #   # as that will conflict with devise routes declared below
  #   # 'method' instead of 'action' - latter is keyword with its own params entry
  #   devise_scope :user do
  #     get '/:devise/:method', to: 'users/sessions#new', constraints: { devise: 'users', method: 'sign_in' }
  #     post '/:devise/:method', to: 'users/sessions#create', constraints: { devise: 'users', method: 'sign_in' }
  #   end
  # end

  # valid subdomains (company/subdomain exists, excludes www)
  constraints(CompanySubdomain) do

    get '/', to: 'stories#index'

    get '/widgets/:type/cs', to: 'widgets#script'
    # specifying a default format here because (for unknown reason) ajax jsonp
    # request sent from IE11 was resulting in request interpreted as html
    get '/widgets/:type/html', to: 'widgets#html', as: 'widget_html', format: 'js'
    get '/widgets/track', to: 'widgets#track'
     # legacy widgets
    get '/widget/cs', to: 'widgets#script'

    resources :stories, only: :index
    # see below for route to public story page

    authenticate :user do

      # using constraints to get access to the request object and thereby the signed in user,
      # this allows us to provide the company_id parameter that's missing from the route
      get '/:workflow_stage', to: 'companies#show',
            constraints: lambda { |params, request|
              params[:id] = request.env['warden'].user(:user).try(:company_id).to_s
              params[:workflow_stage].match(/(prospect|curate|promote|measure)/) &&
              params[:id].present?  # i.e. user signed in
            }, as: 'company_main'
      get '/curate/:customer_slug/:story_slug', to: 'stories#edit',
            constraints: lambda { |params, request|
              Customer.friendly.exists?(params[:customer_slug]) &&
              Story.friendly.exists?(params[:story_slug]) &&
              params[:id] = Story.friendly.find(params[:story_slug]).id
            }, as: 'curate_story'
      get '/promote/preview/:story_slug', to: 'adwords#preview',
            constraints: lambda { |params, request|
              Story.friendly.exists?(params[:story_slug]) &&
              params[:id] = Story.friendly.find(params[:story_slug]).id
            }
      get '/settings', to: 'companies#edit',
            constraints: lambda { |params, request|
              params[:id] = request.env['warden'].user(:user).company_id.to_s
              true
            }, as: 'company_settings'

      resources :companies, only: [:show, :edit, :update] do
        resources :customers, only: [:create, :update, :destroy], shallow: true
        resources :successes, only: [:create, :update, :destroy], shallow: true do
          resources :contributions, only: [:index]
          resources :results, only: [:create, :destroy]
        end
        resources :stories, only: [:edit, :create, :update, :destroy], shallow: true do
          get '/promoted', on: :collection, to: 'stories#promoted'
          member do
            post '/promote', to: 'stories#promote'
            put '/promote', to: 'stories#promote'
            delete '/promote', to: 'stories#promote'
            post '/adwords', to: 'adwords#create_story_ads'
            put '/adwords', to: 'adwords#update_story_ads'
            delete '/adwords', to: 'adwords#remove_story_ads'
            put :ctas
            put :tags
          end
        end
        # resources :stories, only: [:create]
        resources :contributions, except: [:new, :edit, :update], shallow: true do
          # need to distinguish '/contributions/:id' routes from '/contributions/:token' routes;
          # hence :update is excluded above and added below
          # (note :edit always uses '/contributions/:token/:type' route
          member { put :update, constraints: { id: /\d+/ } }
        end
        resources :ctas, only: [:show, :create, :update, :destroy], shallow: true
        resources :crowdsourcing_templates, except: [:index]
        member { get '/promote-settings', to: 'companies#show' }
        member { put :widget }
        member { put :promote }
        # need :get for the sync. response (redirect_to)
        # and :put for the async. response (see companies/promote.js.erb)
        member { get '/adwords', to: 'adwords#update_company' }
        member { put '/adwords', to: 'adwords#update_company' }
        member { put '/adwords/sync', to: 'adwords#sync_company', as: 'adwords_sync' }
      end

      get '/successes', to: 'successes#index'

      # analytics
      get '/analytics/charts', to: 'analytics#charts', as: 'charts'
      get '/analytics/visitors', to: 'analytics#visitors', as: 'measure_visitors'
      get '/analytics/stories', to: 'analytics#stories', as: 'measure_stories'

      # user profile
      get   '/user-profile', to: 'profile#edit', as: 'edit_profile'

      # approval PDF
      get '/stories/:id/approval', to: 'stories#approval', as: 'story_approval'

    end

    # token needed for access outside of user-authorized routes
    # type IN ('contribution', 'feedback', 'opt_out', 'remove')
    get '/contributions/:token/confirm', to: 'contributions#confirm_submission', as: 'confirm_submission'
    get '/contributions/:token/:type', to: 'contributions#edit', as: 'edit_contribution', constraints: { type: /(contribution|feedback)/ }
    get '/contributions/:token/:type', to: 'contributions#update', constraints: { type: /(opt_out|remove)/ }
    put '/contributions/:token', to: 'contributions#update', as: 'contributor_submission', constraints: { submission: true }

    # linkedin
    get '/user-profile/linkedin_connect', to: 'profile#linkedin_connect', as: 'linkedin_connect'
    get '/user-profile/linkedin_callback', to: 'profile#linkedin_callback'

    # need to pick up on devise sign-in route here, without doing so explicitly
    # as that will conflict with devise routes declared below
    # 'method' instead of 'action' - latter is keyword with its own params entry
    devise_scope :user do
      get '/:devise/:method', to: 'users/sessions#new', constraints: { devise: 'users', method: 'sign_in' }
    end

    # public story route moved down here so it doesn't hijack any other routes via dynamic segments.
    # don't call this route 'story' or it will leave the PUT and DELETE routes (above)
    # without an alias
    constraints(StoryPathConstraint) do
      get '/:customer/:product/:title', to: 'stories#show', as: 'public_story'
      get '/:customer/:title', to: 'stories#show', as: 'public_story_no_product'
    end

    # find a tag by its slug, necessary to set filter select boxes
    # on sync load of stories#index
    get   '/companies/:company_id/story_categories/:slug', to: 'story_categories#show'
    get   '/companies/:company_id/products/:slug', to: 'products#show'

    # broken links
    get '/*all', to: 'site#valid_subdomain_bad_path'

  end

  # all other subdomains
  # get '/*all', to: 'site#strip_subdomain', constraints: { subdomain: 'www' }
  get '/', to: 'site#invalid_subdomain', constraints: { subdomain: /.+/ }
  get '/*all', to: 'site#invalid_subdomain', constraints: { subdomain: /.+/ }

  root 'site#index'

  # these will be without subdomain
  get   '/register', to: 'companies#new', as: 'register_company'
  post  '/companies', to: 'companies#create', as: 'create_company'

  # user profile - company not registered (Curator or Contributor)
  # (need to give the route a different alias to distinguish from the one
  #  under subdomains)
  get   '/user-profile', to: 'profile#edit', as: 'edit_profile_no_company'
  get   '/user-profile/linkedin_connect', to: 'profile#linkedin_connect', as: 'linkedin_connect_no_company'
  get   '/user-profile/linkedin_callback', to: 'profile#linkedin_callback'

  # above comments about distinguishing the route apply to below as well
  #
  # this route is for the case of a Contributor being logged in (no subdomain)
  # and updating a Contribution by checking or unchecking a LinkedIn Profile box
  put   '/contributions/:token', to: 'contributions#update'


  devise_for :users, controllers: {
      sessions: 'users/sessions',
      registrations: 'users/registrations',
      passwords: 'users/passwords',
      confirmations: 'users/confirmations',
      unlocks_controller: 'users/unlocks',
      omniauth_callbacks_controller: 'users/omniauth_callbacks'
    }

  # Store Front
  get '/product', to: 'site#store_front'
  get '/plans', to: 'site#store_front'
  get '/our-company', to: 'site#store_front'
  get '/team', to: 'site#store_front'
  get '/tos', to: 'site#store_front', as: 'tos'
  get '/privacy', to: 'site#store_front'
  get '/our-story', to: 'site#store_front'

end

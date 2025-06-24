
#
# this comes in handy if the current_user is needed
# request.env['warden'].user(:user)
#
Rails.application.routes.default_url_options = {
  protocol: Rails.env.production? ? 'https' : 'http',
  host: ENV['HOST_NAME']
}

Rails.application.routes.draw do
  root 'site#landing', constraints: { subdomain: '' }
  get '/:page', to: 'site#landing', constraints: { subdomain: '', page: /product|plans|company|team|terms|privacy|our-story/ }
  
  # TODO Do this for each subdomain
  get '/sitemap', to: 'site#sitemap'
  get '/:google', to: 'site#google_verify', constraints: { google: /google\w+/ }
  
  # mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  
  constraints(DeviseSubdomain) do
    devise_for :admins
    devise_for(
      :users, 
      controllers: {
        sessions: 'users/sessions',
        registrations: 'users/registrations',
        passwords: 'users/passwords',
        confirmations: 'users/confirmations',
        unlocks_controller: 'users/unlocks',
        omniauth_callbacks_controller: 'users/omniauth_callbacks'
      }
    )

    # custom routes
    # add 'csp' to the name where necessary to prevent conflict with devise routes
    # note: routes going to a devise controller don't need to be part of an authenticate block
    as(:user) do
      get('/create-account', to: 'users/registrations#new', as: 'new_csp_user_registration')
      post('/create-account', to: 'users/registrations#create', as: 'create_user_registration')
      get('/sign-in', to: 'users/sessions#new', as: 'new_csp_user_session')
      get('/resend-confirmation', to: 'users/confirmations#new', as: 'new_csp_user_confirmation')
      post('/resend-confirmation', to: 'users/confirmations#create', as: 'resend_user_confirmation')
      get('/send-password-reset', to: 'users/passwords#new', as: 'new_csp_user_password')
      post('/send-password-reset', to: 'users/passwords#create', as: 'send_user_password_reset')
      get('/reset-password', to: 'users/passwords#edit', as: 'edit_csp_user_password')
      put('/reset-password', to: 'users/passwords#update', as: 'reset_user_password')
      get('/user-profile', to: 'users/registrations#edit', as: 'edit_csp_user_registration')
      patch('/user-profile', to: 'users/registrations#update', as: 'update_csp_user_registration')
    end
  end

  use_doorkeeper

  authenticate(:user) do
    # registered user, unregistered company
    get('/settings', to: 'companies#new', as: 'new_company', constraints: { subdomain: '' })
    post('/settings', to: 'companies#create', as: 'companies', constraints: { subdomain: '' })
    
    # zapier
    get '/auth-test', to: 'application#auth_test'
    get '/curators', to: 'companies#get_curators'
    get '/invitation_templates', to: 'companies#get_invitation_templates'
    # was going to do this via successes#index but zapier trigger setup was not sending ?zapier_trigger=true
    get '/win_stories', to: 'successes#zapier_trigger'
    post '/successes', to: 'successes#create', constraints: { zapier_create: 'true' }
    post '/contributions', to: 'contributions#create', constraints: { zapier_create: 'true' }
  end

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

  constraints(CompanySubdomain) do
    get '/', to: 'stories#index', as: 'public_stories'

    get '/plugins/:type/cs', to: 'plugins#main'
    # get '/widgets/:type/cs', to: 'plugins#main'  # legacy (was varmour)
    get '/widget/cs', to: 'plugins#main'  # legacy (trunity)

    # specifying a default format for plugins#show because (for unknown reason) ajax jsonp
    # request sent from IE11 was resulting in request interpreted as html
    # get '/plugins/:type/show', to: 'plugins#show', as: 'plugin_view', format: 'js'
    get '/plugins/:type/show', to: 'plugins#show', as: 'plugin_view'
    get '/plugins/:type/init', to: 'plugins#init', as: 'plugin_init'
    get '/plugins/track', to: 'plugins#track'
    get '/plugins/demo', to: 'plugins#demo'

    # see below for route to public story page
    resources(:stories, { only: [:index] }) do
      get '/search', on: :collection, to: 'stories#search'
    end

    authenticate(:user) do
      get '/:workflow_stage', to: 'companies#show', workflow_stage: /prospect|curate|promote|measure/, as: 'dashboard'
      get '/settings', to: 'companies#edit', as: 'edit_company'
      resources :companies, only: %i[show update] do
        resources :customers, only: %i[edit create update destroy], shallow: true
        resources :successes, except: [:index], shallow: true do
          resource :story, only: %i[new create]
          resources :contributions, only: %i[index new create]
          resources :results, only: %i[create destroy]
          collection { post '/import', to: 'successes#import' }
        end
        resources :stories, only: %i[new edit create update destroy], shallow: true
        # resources :stories, only: [:create]
        resources :contributions, except: %i[new edit update], shallow: true do
          # need to distinguish '/contributions/:id' routes from '/contributions/:token' routes;
          # hence :update is excluded above and added below
          # (note :edit always uses '/contributions/:token/:type' route
          member do 
            put :update, constraints: { id: /\d+/ }
            patch :update, constraints: { id: /\d+/ }
          end
          resource :contributor_invitation, except: [:destroy]
        end
        resources :ctas, only: %i[new show create update destroy]
        resources :invitation_templates
        member { get :set_reset_gads }
        member { put :widget }
        # need :get for the sync. response (redirect_to)
        # and :put for the async. response (see companies/promote.js.erb)
        member { put '/adwords/reset', to: 'adwords#sync_company', as: 'adwords_sync' }
        resources :adwords_ads, only: %i[index show edit update], shallow: true
      end

      get '/successes', to: 'successes#index'

      # analytics
      get '/analytics/charts', to: 'analytics#charts', as: 'charts'
      get '/analytics/visitors', to: 'analytics#visitors', as: 'measure_visitors'
      get '/analytics/stories', to: 'analytics#stories', as: 'measure_stories'

      # impersonate another user
      devise_scope(:user) do
        post('/impersonate/:imitable_user_id', to: 'users/sessions#impersonate', as: 'impersonate_user')
      end
    end

    # token needed for access outside of user-authorized routes
    # type IN ('contribution', 'feedback', 'opt_out', 'remove')
    get '/contributions/:token/confirm', to: 'contributions#confirm_submission', as: 'confirm_submission'
    get '/contributions/:token/:type', to: 'contributions#edit', as: 'edit_contribution', constraints: { type: /(contribution|feedback)/ }
    get '/contributions/:token/:type', to: 'contributions#update', constraints: { type: /(opt_out|remove)/ }
    put '/contributions/:token', to: 'contributions#update', as: 'contributor_submission', constraints: { submission: true }

    # need to pick up on devise sign-in route here, without doing so explicitly
    # as that will conflict with devise routes declared below
    # 'method' instead of 'action' - latter is keyword with its own params entry
    # devise_scope :user do
    #   get '/:devise/:method', to: 'users/sessions#new', constraints: { devise: 'users', method: 'sign_in' }
    # end

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

  put '/contributions/:token', to: 'contributions#update', constraints: { subdomain: '' }
  
  # Not found (parends ensure root path matches)
  get '(*all)', to: 'site#not_found'
end

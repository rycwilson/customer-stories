
#
# this comes in handy if the current_user is needed
# request.env['warden'].user(:user)
#
Rails.application.routes.default_url_options = {
  protocol: Rails.env.development? || Rails.env.test? ? 'http' : 'https',
  host: ENV['HOST_NAME']
}

Rails.application.routes.draw do
  devise_for :admins
  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

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

  # since this is going to a devise controller, no authenticate block is needed
  as(:user) do
    get('/user-profile', to: 'users/registrations#edit', as: 'edit_user')
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

    get '/', to: 'stories#index'

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
      get '/share_on_linkedin', on: :member, to: 'stories#share_on_linkedin'
    end

    get(
      '/promote/preview/:story_slug', 
      to: 'adwords_ads#preview',
      constraints: lambda { |params, request| Story.friendly.exists?(params[:story_slug]) }
    )

    authenticate(:user) do
      get('/:workflow_stage', to: 'companies#show', workflow_stage: /prospect|curate|promote|measure/, as: 'dashboard')
      get('/settings', to: 'companies#edit', as: 'edit_company')
      resources :companies, only: [:show, :update] do
        resources :customers, only: [:edit, :create, :update, :destroy], shallow: true
        resources :successes, except: [:index], shallow: true do
          resource :story, only: [:new, :create]
          resources :contributions, only: [:index, :new, :create]
          resources :results, only: [:create, :destroy]
          collection { post '/import', to: 'successes#import' }
        end
        resources :stories, only: [:new, :edit, :create, :update, :destroy], shallow: true
        # resources :stories, only: [:create]
        resources :contributions, except: [:new, :edit, :update], shallow: true do
          # need to distinguish '/contributions/:id' routes from '/contributions/:token' routes;
          # hence :update is excluded above and added below
          # (note :edit always uses '/contributions/:token/:type' route
          member do 
            put :update, constraints: { id: /\d+/ }
            patch :update, constraints: { id: /\d+/ }
          end
          resource :contributor_invitation, except: [:destroy]
        end
        resources :ctas, only: [:new, :show, :create, :update, :destroy]
        resources :invitation_templates
        member { get :set_reset_gads }
        member { get '/promote-settings', to: 'companies#show' }
        member { put :widget }
        # need :get for the sync. response (redirect_to)
        # and :put for the async. response (see companies/promote.js.erb)
        member { put '/adwords/reset', to: 'adwords#sync_company', as: 'adwords_sync' }
        
        resources :adwords_ads, only: [:index, :edit, :update], shallow: true
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

      # approval PDF
      get '/stories/:id/approval', to: 'stories#approval', as: 'story_approval'
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

    # public story route moved down here so it doesn't hijack any other routes via dynamic segments.
    # don't call this route 'story' or it will leave the PUT and DELETE routes (above)
    # without an alias
    constraints(StoryPathConstraint) do
      get(
        '/:customer/:product/:title',
        to: 'stories#track',
        constraints: -> (request) { request.query_parameters[:track].present? }
      )
      get(
        '/:customer/:title',
        to: 'stories#track',
          constraints: -> (request) { request.query_parameters[:track].present? }
      )
      get '/:customer/:product/:title', to: 'stories#show', as: 'public_story'
      get '/:customer/:title', to: 'stories#show', as: 'public_story_no_product'
          
      # hidden stories
      get(
        '/:random_string', 
        to: 'stories#show',
        constraints: -> (request) { Story.exists?(hidden_link: request.url) }, 
        hidden_link: true
      )
    end

    # broken links
    get '/*all', to: 'site#valid_subdomain_bad_path'
  end

  # all other subdomains
  # get '/*all', to: 'site#strip_subdomain', constraints: { subdomain: 'www' }
  get '/', to: 'site#invalid_subdomain', constraints: { subdomain: /.+/ }
  get '/*all', to: 'site#invalid_subdomain', constraints: { subdomain: /.+/ }

  root 'site#landing', { action: 'home' }
  get '/:page', to: 'site#landing', constraints: { page: /product|plans|company|team|terms|privacy|our-story/ }
  get '/sitemap', to: 'site#sitemap'
  get '/:google', to: 'site#google_verify', constraints: { google: /google\w+/ }

  # this route is for the case of a Contributor being logged in (no subdomain)
  put   '/contributions/:token', to: 'contributions#update'
end

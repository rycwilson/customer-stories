# frozen_string_literal: true

get '/', to: 'stories#index'
get '/stories', to: 'stories#index', constraints: ->(req) { req.format == :json }

get '/plugins/:type/cs', to: 'plugins#main'
# get '/widgets/:type/cs', to: 'plugins#main'  # legacy (was varmour)
get '/widget/cs', to: 'plugins#main' # legacy (trunity)

# specifying a default format for plugins#show because (for unknown reason) ajax jsonp
# request sent from IE11 was resulting in request interpreted as html
# get '/plugins/:type/show', to: 'plugins#show', as: 'plugin_view', format: 'js'
get '/plugins/:type/show', to: 'plugins#show', as: 'plugin_view'
get '/plugins/:type/init', to: 'plugins#init', as: 'plugin_init'
get '/plugins/track', to: 'plugins#track'
get '/plugins/demo', to: 'plugins#demo'

authenticate(:user) do
  get(
    '/:workflow_stage',
    to: 'companies#show',
    workflow_stage: /prospect|curate|promote|measure/,
    as: 'dashboard'
  )
  get '/settings', to: 'companies#edit', as: 'edit_company'
  resources :companies, only: %i[show update] do
    member do
      patch 'tags'
      patch 'ads'
      get 'activity', constraints: ->(req) { req.format == :json }
    end
    resources :customers, only: %i[edit create update destroy], shallow: true
    resources :successes, except: [:index], shallow: true do
      resource :story, only: %i[new create]
      resources :contributions, only: %i[index new create]
      resources :results, only: %i[create destroy]
      collection { post '/import', to: 'successes#import' }
    end
    resources :stories, only: %i[new edit create update destroy], shallow: true
    # resources :stories, only: [:create]
    resources :contributions, except: %i[new update], shallow: true do
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
    resources :visitors, only: [:index], constraints: ->(req) { req.format == :json }
    member { get :set_reset_gads }
    member { put :widget }
    # need :get for the sync. response (redirect_to)
    # and :put for the async. response (see companies/promote.js.erb)
    member { put '/adwords/reset', to: 'adwords#sync_company', as: 'adwords_sync' }
    resources :adwords_ads, only: %i[index show edit update], shallow: true
  end

  get '/successes', to: 'successes#index'

  # impersonate another user
  devise_scope(:user) do
    post(
      '/impersonate/:imitable_user_id',
      to: 'users/sessions#impersonate',
      as: 'impersonate_user'
    )
  end
end

# token needed for access outside of user-authorized routes
# type IN ('contribution', 'feedback', 'opt_out', 'remove')
get(
  '/contributions/:token/confirm',
  to: 'contributions#confirm_submission',
  as: 'confirm_submission'
)
get(
  '/contributions/:token/:type',
  to: 'contributions#edit',
  as: 'contributor_edit_contribution',
  constraints: { type: /(contribution|feedback)/ }
)
get(
  '/contributions/:token/:type',
  to: 'contributions#update',
  constraints: { type: /(opt_out|remove)/ }
)
put(
  '/contributions/:token',
  to: 'contributions#update',
  as: 'contributor_submission',
  constraints: { submission: true }
)

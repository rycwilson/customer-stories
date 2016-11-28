
Rails.application.routes.default_url_options = {
    protocol: Rails.env.production? ? 'https' : 'http',
    host: ENV['HOST_NAME']
}

Rails.application.routes.draw do

  devise_for :admins

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

  get '/sitemap', to: 'site#sitemap'
  get '/:google', to: 'site#google_verify', constraints: { google: /google\w+/ }

  # admins only
  get '/switch_user', to: 'switch_user#set_current_user'
  get '/switch_user/remember_user', to: 'switch_user#remember_user'

  # sendgrid events (currently tracking open and click)
  post '/esp/notifications', to: 'site#esp_notifications'

  # clicky custom logging (currently tracking social shares)
  post '/analytics', to: 'analytics#create'

  # valid subdomains (company/subdomain exists, excludes www)
  constraints(Subdomain) do

    # giving this route an alias so we can use csp_stories_url
    # instead of stories_url in the widgets controller
    get '/', to: 'stories#index', as: 'csp_stories'

    # Widget
    get '/widget/cs', to: 'widgets#script', as: 'widget'
    # specifying a default format here because (for unknown reason) ajax jsonp
    # request sent from IE11 was resulting in request interpreted as html
    get '/widget/cs-data', to: 'widgets#data', as: 'widget_data', format: 'js'

    get '/track_widget', to: 'widgets#track'

    # Stories - public access
    resources :stories, only: :index
    # see below for route to public story page

    # Company home / Story curation - authentication required
    authenticate :user do
      resources :companies, only: [:show, :edit, :update] do
        resources :stories, only: [:create]
      end
      resources :stories, only: [:edit, :update, :destroy] do
        resources :results, only: [:create, :update, :destroy]
      end

      get '/companies/:id/activity', to: 'companies#activity', as: 'company_activity'

      # approval PDF
      get '/stories/:id/approval', to: 'stories#approval', as: 'story_approval'

      # outbound actions
      get   '/outbound_forms/:id', to: 'outbound_actions#show', as: 'outbound_form'
      post  '/stories/:id/outbound_actions', to: 'outbound_actions#create',
              as: 'new_outbound_action'
      delete '/outbound_actions/:id', to: 'outbound_actions#destroy',
              as: 'outbound_action'

      # delete a Prompt
      delete '/prompts/:id', to: 'prompts#destroy'

      # user profile
      get   '/profile/edit', to: 'profile#edit', as: 'edit_profile'
      get   '/profile/linkedin_connect', to: 'profile#linkedin_connect',
                                         as: 'linkedin_connect'
    end

    # no authentication required (may come from a submission)
    get   '/profile/linkedin_callback', to: 'profile#linkedin_callback'

    # Email Templates
    resources :email_templates, only: [:show, :update]
    post   '/email_templates/:id/test', to: 'email_templates#test'


    # Contributions
    post  '/contribution_requests', to: 'contribution_requests#create'
    post  '/stories/:id/contributions', to: 'contributions#create',
                                        as: 'story_contributions'
    put   '/contributions/:id/request_contribution',
                    to: 'contributions#request_contribution',
                    as: 'request_contribution'

    get   '/contributions/:id/confirm', to: 'contributions#confirm',
                                        as: 'confirm_contribution'
    get   '/contributions/:id/confirm_request', to: 'contributions#confirm_request',
                                        as: 'confirm_contribution_request'
    # type is: contribution, feedback, unsubscribe, opt_out
    get   '/contributions/:token/:type', to: 'contributions#edit',
                                         as: 'edit_contribution',
                    constraints: { type: /(contribution|feedback|unsubscribe|opt_out)/ }
    # this route returns json data for the contribution
    # presently only need this when removing a linkedin_url from a contribution
    get   '/contributions/:id', to: 'contributions#show'
    put   '/contributions/:token', to: 'contributions#update'

    # need to pick up on devise sign-in route here, without doing so explicitly
    # as that will conflict with devise routes declared below
    # 'method' instead of 'action' - latter is keyword with its own params entry
    devise_scope :user do
      get '/:devise/:method', to: 'users/sessions#new',
                     constraints: { devise: 'users', method: 'sign_in' }
    end

    # public story route moved down here so it doesn't hijack any other routes.
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
  resources :companies, only: [:new, :create]

  # user profile - company not registered (Curator or Contributor)
  # (need to give the route a different alias to distinguish from the one
  #  under subdomains)
  get   '/profile/edit', to: 'profile#edit', as: 'edit_profile_no_company'
  get   '/profile/linkedin_connect', to: 'profile#linkedin_connect', as: 'linkedin_connect_no_company'
  get   '/profile/linkedin_callback', to: 'profile#linkedin_callback', as: 'linkedin_callback'

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

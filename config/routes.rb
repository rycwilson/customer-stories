Rails.application.routes.draw do

  ## TODO!!!  Add route for devise Admin scope to the RailsAdmin page(s) /admin
  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'

  # valid subdomains (company/subdomain exists, excludes www)
  constraints(Subdomain) do

    get '/', to: 'stories#index'

    # Stories - public access
    resources :stories, only: [:index, :show]

    # Company home / Story curation - authentication required
    authenticate :user do
      resources :companies, only: [:show, :update] do
        resources :stories, only: [:new, :create]
      end
      resources :stories, only: [:edit, :update, :destroy]
    end

    # Email Templates
    resources :email_templates, only: [:show, :update]

    # Contributions
    post  '/stories/:id/contributions', to: 'contributions#create',
                                        as: 'story_contributions'
    put   '/contributions/:id/request_contribution',
                    to: 'contributions#request_contribution_email',
                    as: 'request_contribution'
    get   '/contributions/:id/confirm', to: 'contributions#update',
                                        as: 'confirm_contribution'
    # type is: contribution, feedback, unsubscribe, opt_out
    get   '/contributions/:token/:type', to: 'contributions#edit',
                                         as: 'edit_contribution',
                    constraints: { type: /(contribution|feedback|unsubscribe|opt_out)/ }
    put   '/contributions/:token', to: 'contributions#update',
                                   as: 'contribution'

    # delete a Result
    delete  '/results/:id', to: 'results#destroy'

    # LinkedIn Oauth2 (omniauth gem)
    get '/auth/linkedin/callback', to: 'profile#linkedin_callback'

    # need to pick up on devise sign-in route here, without doing so explicitly
    # as that will conflict with devise routes declared below
    # 'method' instead of 'action' - latter is keyword with its own params entry
    devise_scope :user do
      get '/:devise/:method', to: 'users/sessions#new',
                     constraints: { devise: 'users', method: 'sign_in' }
    end

    # broken links
    get '/*all', to: 'site#valid_subdomain_bad_path'

  end

  # all other subdomains
  get '/', to: 'site#invalid_subdomain', constraints: { subdomain: /.+/ }
  get '/*all', to: 'site#invalid_subdomain', constraints: { subdomain: /.+/ }

  root 'site#index'

  # these will be without subdomain
  resources :companies, only: [:new, :create]

  devise_for :users, controllers: {
      sessions: 'users/sessions',
      registrations: 'users/registrations',
      passwords: 'users/passwords',
      confirmations: 'users/confirmations',
      unlocks_controller: 'users/unlocks',
      omniauth_callbacks_controller: 'users/omniauth_callbacks'
    }

  # Store Front
  get '/product', to: 'site#product'
  get '/plans', to: 'site#plans'
  get '/our-company', to: 'site#our-company'
  get '/tea m', to: 'site#team'
  get '/tos', to: 'site#tos', as: 'tos'
  get '/privacy', to: 'site#privacy'
  get '/our-story', to: 'site#our-story'

end

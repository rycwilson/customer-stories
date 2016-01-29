Rails.application.routes.draw do

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  root 'site#index'
  get '/product', to: 'site#product'
  get '/plans', to: 'site#plans'
  get '/our-company', to: 'site#our-company'
  get '/team', to: 'site#team'
  get '/tos', to: 'site#tos', as: 'tos'
  get '/privacy', to: 'site#privacy'
  get '/our-story', to: 'site#our-story'

  devise_for :users, controllers: {
      sessions: 'users/sessions',
      registrations: 'users/registrations',
      passwords: 'users/passwords',
      confirmations: 'users/confirmations',
      unlocks_controller: 'users/unlocks',
      omniauth_callbacks_controller: 'users/omniauth_callbacks'
    }

  # customize Devise routes
  # devise_scope :user do
  #   put 'users/:id', to: 'users/registrations#update', as: 'update_user'
  # end

  #
  # Companies and Stories
  #
  # stories#index nested under company, but not authenticated
  get '/companies/:company_id/stories', to: 'stories#index', as: 'company_stories'
  # stories#show is public
  resources :stories, only: [:show]
  # all others need authentication...
  authenticate :user do
    resources :companies, except: [:index, :destroy] do
      resources :stories, only: [:new, :create]
    end
    resources :stories, only: [:edit, :update, :destroy]
  end


  # above code condenses commented code below, and enables devise user authentication
  # but: only checks if someone is logged in, not who that someone is

  # except: index, destroy
  # post  '/companies', to: 'companies#create'
  # get   '/companies/new', to: 'companies#new', as: 'new_company'
  # get   '/companies/:id/edit', to: 'companies#edit', as: 'edit_company'
  # get   '/companies/:id', to: 'companies#show', as: 'company'
  # patch '/companies/:id', to: 'companies#update'
  # get   '/companies/:id/stories', to: 'stories#index', as: 'company_stories'
  # post  '/companies/:id/stories', to: 'stories#create'
  # get   '/companies/:id/stories/new', to: 'stories#new', as: 'new_company_story'
  # get   '/stories/:id/edit', to: 'stories#edit', as: 'edit_story'
  # get   '/stories/:id', to: 'stories#show', as: 'story'
  # put   '/stories/:id', to: 'stories#update'
  # delete '/stories/:id', to: 'stories#destroy'

  #
  # Contributions
  #
  post  '/stories/:id/contributions', to: 'contributions#create', as: 'story_contributions'
  put   '/contributions/:id/request_contribution',
        to: 'contributions#contribution_request_email', as: 'request_contribution'
  get   '/contributions/:id/confirm', to: 'contributions#update', as: 'confirm_contribution'
  # type is: contribution, feedback, opt_out
  get   '/contributions/:token/:type', to: 'contributions#edit', as: 'edit_contribution'
  put   '/contributions/:token', to: 'contributions#update', as: 'contribution'

  #
  # LinkedIn Oauth2 (omniauth gem)
  #
  get '/auth/linkedin/callback', to: 'profile#linkedin'

  get     '/profile', to: 'profile#show'
  put     '/profile', to: 'profile#update'
  delete  '/profile', to: 'profile#destroy'
  get     '/profile/edit', to: 'profile#edit'

## TODO!!!  Add route for devise Admin scope to the RailsAdmin page(s) /admin

end

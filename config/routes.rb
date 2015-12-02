Rails.application.routes.draw do

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  root 'site#index'
  get '/product' => 'site#product'
  get '/plans' => 'site#plans'
  get '/our-company' => 'site#our-company'
  get '/team' => 'site#team'
  get '/tos' => 'site#tos'
  get '/privacy' => 'site#privacy'
  get '/our-story' => 'site#our-story'

  post  '/companies', to: 'companies#create'
  get   '/companies/new', to: 'companies#new', as: 'new_company'
  get   '/companies/:id', to: 'companies#show', as: 'company'
  patch '/companies/:id', to: 'companies#update'
  get   '/companies/:id/edit', to: 'companies#edit', as: 'edit_company'

  get   '/companies/:id/stories', to: 'stories#index', as: 'company_stories'
  post  '/companies/:id/stories', to: 'stories#create'
  get   '/companies/:id/stories/new', to: 'stories#new', as: 'new_company_story'
  get   '/stories/:id/edit', to: 'stories#edit', as: 'edit_story'
  get   '/stories/:id', to: 'stories#show', as: 'story'
  put   '/stories/:id', to: 'stories#update'
  delete '/stories/:id', to: 'stories#destroy'

  devise_for :users, controllers: {
      sessions: 'users/sessions',
      registrations: 'users/registrations',
      passwords: 'users/passwords',
      confirmations: 'users/confirmations'
    }

  get '/auth/linkedin/callback', to: 'profile#linkedin'

  get     '/profile', to: 'profile#show'
  put     '/profile', to: 'profile#update'
  delete  '/profile', to: 'profile#destroy'
  get     '/profile/edit', to: 'profile#edit'

## TODO!!!  Add route for devise Admin scope to the RailsAdmin page(s) /admin

end

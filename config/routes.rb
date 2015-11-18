Rails.application.routes.draw do

  root 'site#index'
  get '/product' => 'site#product'
  get '/plans' => 'site#plans'
  get '/csp' => 'site#csp'
  get '/team' => 'site#team'
  get '/tos' => 'site#tos'
  get '/privacy' => 'site#privacy'

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

  get     '/profile', to: 'profile#show'
  put     '/profile', to: 'profile#update'
  delete  '/profile', to: 'profile#destroy'
  get     '/profile/edit', to: 'profile#edit'

end

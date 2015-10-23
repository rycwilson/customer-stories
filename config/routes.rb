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

  get   '/stories/new', to: 'stories#new', as: 'new_story'
  get   '/stories/:id', to: 'stories#show', as: 'story'

  devise_for :users, controllers: {
      sessions: 'users/sessions',
      registrations: 'users/registrations'
    }

  get     '/profile', to: 'profile#show'
  put     '/profile', to: 'profile#update'
  delete  '/profile', to: 'profile#destroy'
  get     '/profile/edit', to: 'profile#edit'

end

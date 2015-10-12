Rails.application.routes.draw do

  root 'site#index'

  # json request...
  # this route needs to be separate from 'get companies/:id' because
  # the angular js code doesn't initially know anything about the company
  # (so looking up by id not possible)
  get   '/account', to: 'companies#show'
  post  '/account', to: 'companies#create'

  post  '/companies', to: 'companies#create'
  get   '/companies/new', to: 'companies#show', as: 'new_company'
  # angular route
  get   '/companies/:id', to: 'companies#show', as: 'company'
  patch '/companies/:id', to: 'companies#update'
  get   '/companies/:id/edit', to: 'companies#edit', as: 'edit_company'

  get   '/companies/:id/stories', to: 'stories#index', as: 'company_stories'
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

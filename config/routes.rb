Rails.application.routes.draw do

  root 'site#index'

  # TODO: this is a generic route for single test user (Company Admin)
  # Once there is a page for registered users who have not yet
  # specified/registered their company, then this route will
  # be company-specific, i.e. company_path(@company)
  # Remember to change account_path in application.rb

  # json request
  # this route needs to be separate from 'get companies/:id' because
  # the angular js code doesn't initially know anything about the company
  get   '/account', to: 'companies#show'
  post  '/account', to: 'companies#create'

  post  '/companies', to: 'companies#create'
  get   '/companies/new', to: 'companies#show', as: 'new_company'
  # angular route
  get   '/companies/:id', to: 'companies#show', as: 'company'
  patch '/companies/:id', to: 'companies#update'

  get   '/companies/:id/stories', to: 'stories#index', as: 'company_stories'
  get   '/stories/:id', to: 'stories#show', as: 'story'

  devise_for :users, controllers: {
        sessions: 'users/sessions',
        registrations: 'users/registrations'
      }

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end

# frozen_string_literal: true

# devise_for :admins
# use_doorkeeper

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

# Custom routes add 'csp' to the name where necessary to prevent conflict with devise routes
as(:user) do
  get('/create-account', to: 'users/registrations#new', as: 'new_csp_user_registration')
  post('/create-account', to: 'users/registrations#create', as: 'create_user_registration')
  get('/sign-in', to: 'users/sessions#new', as: 'new_csp_user_session')
  get('/resend-confirmation', to: 'users/confirmations#new', as: 'new_csp_user_confirmation')
  post('/resend-confirmation', to: 'users/confirmations#create', as: 'resend_user_confirmation')
  get('/send-password-reset', to: 'users/passwords#new', as: 'new_csp_user_password')
  post('/send-password-reset', to: 'users/passwords#create', as: 'send_user_password_reset')
  get('/reset-password', to: 'users/passwords#edit', as: 'edit_csp_user_password')
  put('/reset-password', to: 'users/passwords#update', as: 'reset_user_password')
  get('/user-profile', to: 'users/registrations#edit', as: 'edit_csp_user_registration')
  patch('/user-profile', to: 'users/registrations#update', as: 'update_csp_user_registration')
end

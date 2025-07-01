# frozen_string_literal: true

get '/auth-test', to: 'application#auth_test'
get '/curators', to: 'companies#get_curators'
get '/invitation_templates', to: 'companies#get_invitation_templates'

# was going to do this via successes#index but zapier trigger setup was not sending ?zapier_trigger=true
get '/win_stories', to: 'successes#zapier_trigger'
post '/successes', to: 'successes#create', constraints: { zapier_create: 'true' }
post '/contributions', to: 'contributions#create', constraints: { zapier_create: 'true' }
# reference: https://www.diaconou.com/blog/rails-session-store-domain-all-beware-of-cnames/
Rails.application.config.session_store(:cookie_store, key: '_csp_session', domain: :all, tld_length: 2)
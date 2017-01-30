
# http://kevinkuchta.com/_site/2014/09/load-useful-data-in-rails-console/

class Object
  private
  def acme
    @_acme ||= Company.find(1)
  end
  def ryan
    @_ryan ||= User.find_by(email:'***REMOVED***')
  end
end

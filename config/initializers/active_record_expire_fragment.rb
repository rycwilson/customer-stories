
# This allows for the expire_fragment method to be called from models.
# Present caching approach relies on after_commit callbacks in models to
# expire fragments as necessary. This is somewhat outside of the MVC pattern
# and may not be the most sustainable solution
# ref: http://stackoverflow.com/questions/393395
class ActiveRecord::Base
  def expire_fragment(*args)
    ActionController::Base.new.expire_fragment(*args)
  end
end
class VisitorAction < ActiveRecord::Base

  belongs_to :company
  belongs_to :success  # could be nil if index page view
  belongs_to :visitor_session
  has_one :visitor, through: :visitor_session
  has_one :story, through: :success

  # this will be initialized as needed in clicky.rake,
  # setting it here will result in error as child models aren't yet loaded
  # also error if in config.after_initialize, as db isn't set up

  # capture the last action that was downloaded, for use in
  # parsing response to rake clicky:download (see clicky.rake)
  class << self
    attr_accessor :last_action
  end

end

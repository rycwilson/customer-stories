class Contribution < ActiveRecord::Base

  belongs_to :user
  belongs_to :success

  before_save :default_values

  def default_values
    self.linkedin ||= false
    # if the callback method returns false (right-hand value above),
    # it will cancel the action, so...
    return true
  end

end

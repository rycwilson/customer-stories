class Success < ActiveRecord::Base

  belongs_to :customer
  has_one :story, dependent: :destroy

end


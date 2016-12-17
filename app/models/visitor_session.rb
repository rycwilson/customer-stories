class VisitorSession < ActiveRecord::Base

  belongs_to :visitor, counter_cache: true
  has_many :visitor_actions, dependent: :destroy
  has_many :page_views
  has_many :story_shares
  has_many :successes, through: :visitor_actions

  scope :company_all, ->(company_id) {
    joins(:page_views)
    .where(visitor_actions: { company_id: company_id })
  }

  @last_session = self.all.sort_by { |session| session.clicky_session_id }.last

  # capture the last session that was downloaded, for use in
  # parsing response to rake clicky:download
  class << self
    attr_accessor :last_session
  end

end

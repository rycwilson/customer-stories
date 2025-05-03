class DropEmailContributionRequests < ActiveRecord::Migration[6.1]
  def change
    drop_table :email_contribution_requests, if_exists: true
  end
end

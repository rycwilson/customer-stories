class RemoveNameFromEmailContributionRequests < ActiveRecord::Migration
  def change
    remove_column :email_contribution_requests, :name, :string
  end
end

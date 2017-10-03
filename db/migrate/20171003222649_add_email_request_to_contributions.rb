class AddEmailRequestToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :email_request, :text
  end
end

class AddAccessTokenToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :access_token, :string
  end
end

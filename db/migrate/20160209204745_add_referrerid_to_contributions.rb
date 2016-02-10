class AddReferreridToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :referrer_id, :integer
  end
end

class AddGtmIdToCompanies < ActiveRecord::Migration
  def change
    add_column :companies, :gtm_id, :string
  end
end

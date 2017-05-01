class AddFieldsToCompanies < ActiveRecord::Migration

  def change
    add_column :companies, :promote_tr, :boolean, default: false
    add_column :companies, :promote_crm, :boolean, default: false
  end

end

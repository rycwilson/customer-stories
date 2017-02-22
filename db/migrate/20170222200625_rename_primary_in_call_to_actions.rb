class RenamePrimaryInCallToActions < ActiveRecord::Migration

  def change
    rename_column :call_to_actions, :primary, :company_primary
    rename_column :companies, :primary_cta_color, :primary_cta_background_color
  end

end

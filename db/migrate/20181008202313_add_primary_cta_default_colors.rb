class AddPrimaryCtaDefaultColors < ActiveRecord::Migration[5.0]
  def up
    change_column :companies, :primary_cta_background_color, :string, default: '#337ab7'
    change_column :companies, :primary_cta_text_color, :string, default: '#ffffff'
  end

  def down
    change_column :companies, :primary_cta_background_color, :string, default: nil
    change_column :companies, :primary_cta_text_color, :string, default: nil
  end
end

class AddCtaColorsToCompany < ActiveRecord::Migration

  def change
    add_column :companies, :primary_cta_color, :string
    add_column :companies, :primary_cta_text_color, :string
  end

end

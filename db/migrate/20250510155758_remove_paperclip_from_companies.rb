class RemovePaperclipFromCompanies < ActiveRecord::Migration[6.1]
  def change
    remove_column :companies, :logo_content_type, :string
    remove_column :companies, :logo_file_name, :string
    remove_column :companies, :logo_file_size, :integer
    remove_column :companies, :logo_updated_at, :datetime
  end
end

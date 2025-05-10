class RemoveLinkedinFromUsers < ActiveRecord::Migration[6.1]
  def change
    remove_column :users, :linkedin_company, :string
    remove_column :users, :linkedin_location, :string
    remove_column :users, :linkedin_photo_url, :string
    remove_column :users, :linkedin_title, :string
    remove_column :users, :linkedin_url, :string
  end
end

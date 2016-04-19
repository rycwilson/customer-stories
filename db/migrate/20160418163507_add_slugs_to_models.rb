class AddSlugsToModels < ActiveRecord::Migration

  def change
    add_column :customers, :slug, :string  # name
    add_column :products, :slug, :string  # name
    add_column :stories, :slug, :string  # title
  end

end
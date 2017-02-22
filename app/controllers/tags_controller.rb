class TagsController < ApplicationController

  before_action except: [:destroy] { @company = Company.find(params[:id]) }

  def update
    # binding.remote_pry
    update_tags(@company, params[:company_tags])
    respond_to { |format| format.js }
  end

  def destroy
  end

  private

  # slightly different than updating tags for a story
  def update_tags company, new_tags
    existing_category_tags = company.story_categories
    existing_product_tags = company.products
    # remove deleted category tags ...
    existing_category_tags.each do |category|
      if new_tags[:category].nil? || !(new_tags[:category].include? category.id.to_s)
        tag_instances =
          StoryCategoriesSuccess.where(story_category_id: category.id)
        # expire filter select fragment cache
        company.expire_filter_select_fragments_on_tag_destroy('category', tag_instances)
        # untag stories
        tag_instances.destroy_all
        category.destroy
      end
    end
    # add new category tags ...
    new_tags[:category].each do |category_id|
      if category_id.to_i == 0 # new (custom or default) tag
        company.story_categories << StoryCategory.create(name: category_id)
        # expire filter select fragment cache
        company.increment_curator_category_select_fragments_memcache_iterator
      else
        # do nothing
      end
    end unless new_tags[:category].nil?

    # remove deleted product tags ...
    existing_product_tags.each do |product|
      if new_tags[:product].nil? || !(new_tags[:product].include? product.id.to_s)
        tag_instances = ProductsSuccess.where(product_id: product.id)
        # expire filter select fragment cache
        company.expire_filter_select_fragments_on_tag_destroy('product', tag_instances)
        # untag stories
        tag_instances.destroy_all
        product.destroy
      end
    end
    # add new product tags ...
    new_tags[:product].each do |product_id|
      if product_id.to_i == 0 # new tag
        company.products << Product.create(name: product_id)
        # expire cache
        company.increment_curator_product_select_fragments_memcache_iterator
      else
        # do nothing
      end
    end unless new_tags[:product].nil?
  end

end

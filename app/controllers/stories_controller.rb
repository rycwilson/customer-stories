class StoriesController < ApplicationController

  before_action :find_company, only: [:index, :create]

  def index
    if params[:filter]  # ajax GET request
      @stories = @company.filter_stories params[:filter][:type], params[:filter][:id]
      respond_to do |format|
        format.json { render json: @stories }
      end
    else
      @stories = @company.stories
      @industries = @company.industries_filter_select
    end
  end

  def show
    @story = Story.find params[:id]
  end

  def edit
    @company = current_user.company # company_id not in the stories#edit route
    @story = Story.find params[:id]
    @contributions = @story.success.contributions
    @industries = @company.industries_select
    @industries_pre_select = @story.success.industry_categories.map { |category| category.id }
    @product_categories = @company.product_categories_select
    @product_cats_pre_select = @story.success.product_categories.map { |category| category.id }
    @products = @company.products_select
    @products_pre_select = @story.success.products.map { |category| category.id }
  end

  # TODO: allow for new Customer creation
  # Notice how nested hash keys are treated as strings in the params hash
  # -> due to the way form parameters are name-spaced
  def create
    new_story = params[:story]
    # was a new customer entered? ...
    new_customer = new_story[:customer] if new_story[:customer].to_i == 0
    if new_customer
      customer = Customer.new name: new_customer, company_id: @company.id
      if customer.save
        success = Success.new customer_id: customer.id
      else
        puts 'problem creating Customer'
      end
    else  # existing customer
      success = Success.new customer_id: new_story[:customer]
    end
    if success.save
      story = Story.new title: new_story[:title], success_id: success.id
      if story.save
        assign_tags story, new_story
        redirect_to edit_story_path story
      else
        # problem creating story
        # TODO: wire up some flash messaging, possible to re-render the modal??
        puts 'problem creating Story'
      end
    else
      puts 'problem creating Success'
    end
  end

  def update
    story = Story.find params[:id]
    if params[:story][:industry_tags]  # if updating tags
      update_tags(story, params[:story])
      respond_to do |format|
        format.js
      end
    elsif params[:story][:embed_url]  # if updating video url
      youtube_id = params[:story][:embed_url].match(/v=(?<id>.*)/)[:id]
      params[:story][:embed_url] = "https://www.youtube.com/embed/" + youtube_id
      respond_to do |format|
        if story.update story_params
          # respond with json because we need to update the input field
          # on client side with the modified url ...
          format.json { render json: story.as_json(only: :embed_url) }
        else
          #
        end
      end
    elsif params[:story][:published]
      if story.update story_params
        respond_to do |format|
          format.json { render json: nil } # empty response
        end
      else
      end
    else  # all other updates
      respond_to do |format|
        if story.update story_params
          # format.html { redirect_to(@story, :notice => 'Story was successfully updated.') }
          format.json { respond_with_bip(story) }
        else
          # format.html { render :action => "edit" }
          # format.json { respond_with_bip(story) }
        end
      end
    end
  end

  def destroy
    story = Story.find params[:id]
    story.destroy
    redirect_to company_path(current_user.company_id),
        info: "Story '#{story.title}' was deleted"
  end

  private

  def story_params
    params.require(:story).permit(:title, :quote, :quote_attr, :embed_url, :situation,
        :challenge, :solution, :results, :published, :logo_published)
  end

  def find_company
    @company = Company.find params[:company_id]
  end

  def assign_tags story, new_story

    if new_story[:industry_tags]
      new_story[:industry_tags].each do |selection|
        if selection.to_i == 0   # if it's a generic tag
          # create a new company industry category based on the generic tag
          story.success.industry_categories << IndustryCategory.create(
              name: selection, company_id: current_user.company.id)
        else  # selection is the id of an existing company industry category
          story.success.industry_categories << IndustryCategory.find(selection)
        end
      end
    end

    if new_story[:product_cat_tags]
      new_story[:product_cat_tags].each do |selection|
        story.success.product_categories << ProductCategory.find(selection)
      end
    end

    if new_story[:product_tags]
      new_story[:product_tags].each do |selection|
        story.success.products << Product.find(selection)
      end
    end

  end

  def update_tags story, new_tags
    old_industry_tags = story.success.industry_categories
    old_product_cat_tags = story.success.product_categories
    old_product_tags = story.success.products
    # add new industry tags ...
    unless new_tags[:industry_tags].nil?
      new_tags[:industry_tags].each do |industry_id|
        unless old_industry_tags.any? { |industry| industry.id == industry_id.to_i }
          story.success.industry_categories << IndustryCategory.find(industry_id.to_i)
        end
      end
    end
    # remove deleted industry tags ...
    old_industry_tags.each do |industry|
      unless (new_tags[:industry_tags]) && (new_tags[:industry_tags].include? industry.id.to_s)
        IndustriesSuccess.where("success_id = ? AND industry_category_id = ?",
                                  story.success.id, industry.id)[0].destroy
      end
    end
    # add new product category tags ...
    unless new_tags[:product_cat_tags].nil?
      new_tags[:product_cat_tags].each do |product_cat_id|
        unless old_product_cat_tags.any? { |product_cat| product_cat.id == product_cat_id.to_i }
          story.success.product_categories << ProductCategory.find(product_cat_id.to_i)
        end
      end
    end
    # remove deleted product category tags ...
    old_product_cat_tags.each do |product_cat|
      unless (new_tags[:product_cat_tags]) &&
          (new_tags[:product_cat_tags].include? product_cat.id.to_s)
        ProductCatsSuccess.where("success_id = ? AND product_category_id = ?",
                                  story.success.id, product_cat.id)[0].destroy
      end
    end
    # add new product tags ...
    unless new_tags[:product_tags].nil?
      new_tags[:product_tags].each do |product_id|
        unless old_product_tags.any? { |product| product.id == product_id.to_i }
          story.success.products << Product.find(product_id.to_i)
        end
      end
    end
    # remove deleted product tags ...
    old_product_tags.each do |product|
      unless (new_tags[:product_tags]) && (new_tags[:product_tags].include? product.id.to_s)
        ProductsSuccess.where("success_id = ? AND product_id = ?",
                                  story.success.id, product.id)[0].destroy
      end
    end
  end

end

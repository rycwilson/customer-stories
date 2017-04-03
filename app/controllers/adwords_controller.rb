class AdwordsController < ApplicationController

  def index
    respond_to { |format| format.js }
  end

end

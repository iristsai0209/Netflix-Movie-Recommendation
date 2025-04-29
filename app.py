from flask import Flask, render_template, request, jsonify
import pandas as pd
from chatbot import get_movie_recommendations, analyze_sentiment

app = Flask(__name__)

# 讀取資料集時確保所有欄位都被讀取
df = pd.read_csv('netflix_titles_cleaned.csv', encoding='latin-1')
print("Available columns:", df.columns.tolist())  # 檢查所有欄位
print("Sample age values:", df['age'].head())    # 檢查 age 欄位的值

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '').lower()
    
    if "bye" in user_input or "goodbye" in user_input:
        return jsonify({"response": "Goodbye! Enjoy your movie!"})
    
    if "search movie" in user_input or "find movie" in user_input or "watch" in user_input:
        return jsonify({
            "response": "Let's find a movie for you! Please provide your preferences:",
            "action": "start_recommendation"
        })
    
    return jsonify({
        "response": "I can help you find movies to watch. Just say 'search movie' to start!"
    })

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    preferences = {
        'cast': data.get('cast'),
        'genre': data.get('genre'),
        'keywords': data.get('keywords')
    }
    
    # Filter out empty preferences
    preferences = {k: v for k, v in preferences.items() if v and v.lower() not in ['no', 'none', 'n']}
    
    recommendations = get_movie_recommendations(preferences)
    movies_list = []
    seen_titles = set()
    
    for _, movie in recommendations.iterrows():
        title = movie['title']
        if title not in seen_titles:
            movies_list.append({
                'title': title,
                'genre': movie['listed_in'],
                'cast': movie['cast'],
                'year': movie['release_year'],
                'description': movie['description']
            })
            seen_titles.add(title)
            
            if len(movies_list) >= 3:
                break
    
    return jsonify({"recommendations": movies_list})

if __name__ == '__main__':
    app.run(debug=True) 
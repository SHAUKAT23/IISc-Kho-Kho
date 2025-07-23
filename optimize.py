#!/usr/bin/env python3
"""
Firebase Data Optimization Tool for IISc Kho-Kho App
====================================================

This script provides optimization and maintenance functions for the IISc Kho-Kho web application's 
Firebase backend. It includes functionality to:

1. Validate data schema
2. Optimize Firebase Firestore collections
3. Clean up stale data
4. Generate reports on database usage
5. Serve the web app with gzip compression
6. Monitor database performance

Usage:
    python optimize.py [command] [options]

Commands:
    serve       : Serve the web app with optimized settings
    validate    : Validate data schema in Firestore
    optimize    : Optimize Firestore collections
    cleanup     : Clean up stale data
    report      : Generate database usage report
    monitor     : Monitor database performance in real-time
"""

import os
import sys
import json
import time
import gzip
import shutil
import logging
import argparse
import http.server
import socketserver
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('kho-kho-optimizer')

# Configuration
DEFAULT_PORT = 8000
FIREBASE_CONFIG_FILE = 'firebase-config.json'
DATA_SCHEMA = {
    'players': {
        'required_fields': ['name', 'contact', 'department', 'player_type', 'degreeType', 'category'],
        'optional_fields': ['photo_url', 'created_at', 'updated_at', 'achievements'],
        'field_types': {
            'name': str,
            'contact': str,
            'department': str,
            'player_type': str,
            'degreeType': str, 
            'category': str
        }
    },
    'notifications': {
        'required_fields': ['title', 'message', 'created_at'],
        'optional_fields': ['sender', 'priority', 'expiry_date'],
        'field_types': {
            'title': str,
            'message': str,
            'created_at': object,  # Timestamp
            'sender': str,
            'priority': str,
        }
    },
    'messages': {
        'required_fields': ['text', 'user_id', 'user_name', 'created_at'],
        'optional_fields': ['user_photo', 'attachments'],
        'field_types': {
            'text': str,
            'user_id': str,
            'user_name': str,
            'created_at': object,  # Timestamp
        }
    }
}

class KhoKhoOptimizer:
    """Main class for IISc Kho-Kho app optimization functionality."""
    
    def __init__(self):
        """Initialize the optimizer."""
        self.db = None
        self.app = None
        self.initialized = False
        
    def initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            if self.initialized:
                return True
                
            # Check if credentials file exists
            if not os.path.exists('firebase-credentials.json'):
                logger.warning("Firebase credentials file not found. Some functions may be limited.")
                return False
            
            # Initialize Firebase Admin SDK
            cred = credentials.Certificate('firebase-credentials.json')
            self.app = firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            self.initialized = True
            logger.info("Firebase Admin SDK initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            return False
    
    def validate_data(self, collection_name: str) -> Dict[str, Any]:
        """Validate data in a Firestore collection against schema."""
        if not self.initialize_firebase():
            return {'status': 'error', 'message': 'Firebase not initialized'}
            
        if collection_name not in DATA_SCHEMA:
            return {'status': 'error', 'message': f'Schema not defined for {collection_name}'}
            
        schema = DATA_SCHEMA[collection_name]
        results = {
            'total_documents': 0,
            'valid_documents': 0,
            'invalid_documents': 0,
            'missing_required_fields': {},
            'type_mismatches': {},
            'invalid_document_ids': []
        }
        
        try:
            # Get all documents in the collection
            docs = self.db.collection(collection_name).get()
            
            for doc in docs:
                results['total_documents'] += 1
                doc_data = doc.to_dict()
                doc_id = doc.id
                is_valid = True
                
                # Check required fields
                for field in schema['required_fields']:
                    if field not in doc_data:
                        is_valid = False
                        if field not in results['missing_required_fields']:
                            results['missing_required_fields'][field] = []
                        results['missing_required_fields'][field].append(doc_id)
                
                # Check field types
                for field, expected_type in schema['field_types'].items():
                    if field in doc_data and not isinstance(doc_data[field], expected_type) and doc_data[field] is not None:
                        is_valid = False
                        if field not in results['type_mismatches']:
                            results['type_mismatches'][field] = []
                        results['type_mismatches'][field].append({
                            'doc_id': doc_id, 
                            'expected': expected_type.__name__, 
                            'found': type(doc_data[field]).__name__
                        })
                
                if is_valid:
                    results['valid_documents'] += 1
                else:
                    results['invalid_documents'] += 1
                    results['invalid_document_ids'].append(doc_id)
            
            results['status'] = 'success'
            return results
            
        except Exception as e:
            logger.error(f"Error validating {collection_name} collection: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def optimize_collection(self, collection_name: str) -> Dict[str, Any]:
        """Optimize a Firestore collection."""
        if not self.initialize_firebase():
            return {'status': 'error', 'message': 'Firebase not initialized'}
            
        results = {
            'total_documents': 0,
            'optimized_documents': 0,
            'errors': [],
            'optimizations': []
        }
        
        try:
            # Get all documents in the collection
            docs = self.db.collection(collection_name).get()
            
            for doc in docs:
                results['total_documents'] += 1
                doc_data = doc.to_dict()
                doc_id = doc.id
                optimizations = []
                
                # Perform optimizations based on collection type
                if collection_name == 'players':
                    # Normalize field names to lowercase
                    updates = {}
                    for field in ['Name', 'Contact', 'Department', 'Player_type', 'DegreeType', 'Category']:
                        if field in doc_data and field.lower() not in doc_data:
                            updates[field.lower()] = doc_data[field]
                            optimizations.append(f"Normalized {field} to {field.lower()}")
                    
                    # Ensure category is correctly formatted (men/women)
                    if 'category' in doc_data:
                        category = doc_data['category'].lower()
                        if category not in ['men', 'women'] and 'men' in category:
                            updates['category'] = 'men'
                            optimizations.append("Normalized category to 'men'")
                        elif category not in ['men', 'women'] and 'women' in category:
                            updates['category'] = 'women'
                            optimizations.append("Normalized category to 'women'")
                    
                    # Apply updates if any
                    if updates:
                        self.db.collection(collection_name).document(doc_id).update(updates)
                        results['optimized_documents'] += 1
                        results['optimizations'].append({
                            'doc_id': doc_id,
                            'changes': optimizations
                        })
                
                elif collection_name == 'messages':
                    # Remove empty messages or very short ones (likely test messages)
                    if 'text' in doc_data and (not doc_data['text'] or len(doc_data['text'].strip()) <= 3):
                        self.db.collection(collection_name).document(doc_id).delete()
                        optimizations.append("Removed empty/test message")
                        results['optimized_documents'] += 1
                        results['optimizations'].append({
                            'doc_id': doc_id,
                            'changes': optimizations
                        })
                
            results['status'] = 'success'
            return results
            
        except Exception as e:
            logger.error(f"Error optimizing {collection_name} collection: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def cleanup_stale_data(self, days_threshold: int = 90) -> Dict[str, Any]:
        """Clean up stale data across collections."""
        if not self.initialize_firebase():
            return {'status': 'error', 'message': 'Firebase not initialized'}
            
        results = {
            'notifications_removed': 0,
            'messages_removed': 0,
            'errors': []
        }
        
        try:
            # Calculate cutoff date
            cutoff = datetime.now() - timedelta(days=days_threshold)
            cutoff_timestamp = firestore.Timestamp.from_datetime(cutoff)
            
            # Clean up old notifications
            old_notifications = self.db.collection('notifications').where(
                'created_at', '<', cutoff_timestamp
            ).get()
            
            for doc in old_notifications:
                self.db.collection('notifications').document(doc.id).delete()
                results['notifications_removed'] += 1
            
            # Clean up old chat messages
            old_messages = self.db.collection('messages').where(
                'created_at', '<', cutoff_timestamp
            ).get()
            
            for doc in old_messages:
                self.db.collection('messages').document(doc.id).delete()
                results['messages_removed'] += 1
            
            results['status'] = 'success'
            return results
            
        except Exception as e:
            logger.error(f"Error cleaning up stale data: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate a report on database usage."""
        if not self.initialize_firebase():
            return {'status': 'error', 'message': 'Firebase not initialized'}
            
        report = {
            'timestamp': datetime.now().isoformat(),
            'collections': {},
            'stats': {
                'total_documents': 0,
                'by_collection': {}
            }
        }
        
        try:
            # Get collection statistics
            for collection_name in DATA_SCHEMA.keys():
                docs = self.db.collection(collection_name).get()
                doc_count = len(docs)
                report['collections'][collection_name] = doc_count
                report['stats']['total_documents'] += doc_count
                report['stats']['by_collection'][collection_name] = doc_count
            
            # Add player statistics
            player_stats = {
                'men': 0,
                'women': 0,
                'by_degree_type': {},
                'by_player_type': {}
            }
            
            players = self.db.collection('players').get()
            for player in players:
                data = player.to_dict()
                
                # Count by gender
                category = data.get('category', '').lower()
                if 'men' in category:
                    player_stats['men'] += 1
                elif 'women' in category:
                    player_stats['women'] += 1
                
                # Count by degree type
                degree_type = data.get('degreeType', 'Not specified')
                if degree_type not in player_stats['by_degree_type']:
                    player_stats['by_degree_type'][degree_type] = 0
                player_stats['by_degree_type'][degree_type] += 1
                
                # Count by player type
                player_type = data.get('player_type', '').lower()
                if player_type not in player_stats['by_player_type']:
                    player_stats['by_player_type'][player_type] = 0
                player_stats['by_player_type'][player_type] += 1
            
            report['player_stats'] = player_stats
            
            # Save report to file
            report_path = f"reports/db_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            os.makedirs(os.path.dirname(report_path), exist_ok=True)
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            
            report['status'] = 'success'
            report['report_path'] = report_path
            return report
            
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def serve_app(self, port: int = DEFAULT_PORT, gzip_enabled: bool = True) -> None:
        """Serve the web app with gzip compression."""
        # Create custom HTTP request handler with gzip compression
        class GzipHTTPHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                
            def end_headers(self):
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                super().end_headers()
                
            def send_head(self):
                path = self.translate_path(self.path)
                
                # If path is a directory, look for index.html
                if os.path.isdir(path):
                    self.path = '/index.html'
                    return self.send_head()
                
                # Check if the file exists
                try:
                    f = open(path, 'rb')
                except OSError:
                    self.send_error(404, "File not found")
                    return None
                
                # Check if client accepts gzip encoding
                if gzip_enabled and 'Accept-Encoding' in self.headers:
                    if 'gzip' in self.headers['Accept-Encoding']:
                        # Check file extension for compressible types
                        ext = os.path.splitext(path)[1].lower()
                        compressible = ext in ['.html', '.css', '.js', '.json', '.svg', '.txt']
                        
                        if compressible:
                            # Compress file content
                            f_stat = os.fstat(f.fileno())
                            f_content = f.read()
                            f.close()
                            
                            # Compress content
                            gzip_content = self._gzip_compress(f_content)
                            
                            # Send gzip headers
                            self.send_response(200)
                            self.send_header("Content-type", self.guess_type(path))
                            self.send_header("Content-Encoding", "gzip")
                            self.send_header("Content-Length", str(len(gzip_content)))
                            self.send_header("Last-Modified", self.date_time_string(f_stat.st_mtime))
                            self.end_headers()
                            
                            # Return BytesIO for the compressed content
                            import io
                            return io.BytesIO(gzip_content)
                
                # Fall back to normal serving if not compressing
                ctype = self.guess_type(path)
                f_stat = os.fstat(f.fileno())
                
                self.send_response(200)
                self.send_header("Content-type", ctype)
                self.send_header("Content-Length", str(f_stat[6]))
                self.send_header("Last-Modified", self.date_time_string(f_stat.st_mtime))
                self.end_headers()
                return f
            
            def _gzip_compress(self, content):
                """Compress the given content with gzip."""
                import io
                out = io.BytesIO()
                with gzip.GzipFile(fileobj=out, mode='wb') as f:
                    if isinstance(content, str):
                        f.write(content.encode('utf-8'))
                    else:
                        f.write(content)
                return out.getvalue()
        
        # Create server
        handler = GzipHTTPHandler
        
        with socketserver.TCPServer(("", port), handler) as httpd:
            logger.info(f"Serving at port {port} with gzip compression {'enabled' if gzip_enabled else 'disabled'}")
            logger.info(f"Open http://localhost:{port} in your browser")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                logger.info("Keyboard interrupt received, stopping server")
                httpd.server_close()


def main():
    """Main function to run the optimizer with command-line arguments."""
    parser = argparse.ArgumentParser(description="IISc Kho-Kho Firebase Optimizer")
    parser.add_argument('command', choices=['serve', 'validate', 'optimize', 'cleanup', 'report', 'monitor'], 
                        help='Command to execute')
    parser.add_argument('--collection', '-c', type=str, help='Collection name for validation/optimization')
    parser.add_argument('--port', '-p', type=int, default=DEFAULT_PORT, help='Port for web server')
    parser.add_argument('--days', '-d', type=int, default=90, help='Days threshold for cleanup')
    parser.add_argument('--gzip', '-g', action='store_true', default=True, help='Enable gzip compression')
    
    args = parser.parse_args()
    optimizer = KhoKhoOptimizer()
    
    if args.command == 'serve':
        optimizer.serve_app(port=args.port, gzip_enabled=args.gzip)
    
    elif args.command == 'validate':
        if not args.collection:
            print("Error: Collection name is required for validation")
            return
        
        result = optimizer.validate_data(args.collection)
        print(json.dumps(result, indent=2))
    
    elif args.command == 'optimize':
        if not args.collection:
            print("Error: Collection name is required for optimization")
            return
            
        result = optimizer.optimize_collection(args.collection)
        print(json.dumps(result, indent=2))
    
    elif args.command == 'cleanup':
        result = optimizer.cleanup_stale_data(days_threshold=args.days)
        print(json.dumps(result, indent=2))
    
    elif args.command == 'report':
        result = optimizer.generate_report()
        print(json.dumps(result, indent=2))
    
    elif args.command == 'monitor':
        print("Monitoring not yet implemented")


if __name__ == "__main__":
    main()
